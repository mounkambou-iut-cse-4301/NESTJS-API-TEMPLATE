import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import PDFDocument = require('pdfkit');
import 'pdfkit-table';
import * as ExcelJS from 'exceljs';

export type ExportFormat = 'csv' | 'pdf' | 'xlsx';

const EXPORT_DIR = join(process.cwd(), 'exports');
const TS = () => new Date().toISOString().replace(/[:.]/g, '-');

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  private getUserCommuneIdOrThrow(req: any): number | null {
    const communeId = req?.user?.communeId;
    return communeId ? Number(communeId) : null;
  }

  private async getDbColumns(dbName: string): Promise<string[]> {
    const rows = await this.prisma.$queryRawUnsafe<Array<{ COLUMN_NAME: string }>>(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
      `,
      dbName,
    );
    return rows.map(r => r.COLUMN_NAME);
  }

  private normalizeValue(v: any): any {
    if (v === null || v === undefined) return '';
    if (typeof v === 'bigint') return v.toString();
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') return JSON.stringify(v);
    return v;
  }

  private serializeRows(rows: any[]): any[] {
    return rows.map(row => {
      const out: any = {};
      for (const [k, v] of Object.entries(row ?? {})) out[k] = this.normalizeValue(v);
      return out;
    });
  }

  private toCsv(columns: string[], rows: any[]): string {
    const esc = (s: any) => {
      const v = String(s ?? '');
      return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    };
    const header = columns.join(',');
    const lines = rows.map(r => columns.map(c => esc(r[c])).join(','));
    return [header, ...lines].join('\n');
  }

  private fitCell(v: any): string {
    const s = String(v ?? '');
    return s.length > 120 ? s.slice(0, 117) + '…' : s;
  }

  private computeColumnSizes(count: number, width: number): number[] {
    const w = Math.floor(width / Math.max(count, 1));
    return Array(count).fill(w);
  }

  private async toPdfFile(columns: string[], rows: any[], filename: string): Promise<string> {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const path = join(EXPORT_DIR, filename);

    const doc = new PDFDocument({ margin: 28, size: 'A4' });
    const stream = fsSync.createWriteStream(path);
    doc.pipe(stream);

    doc.fontSize(14).text(filename.replace(/\.pdf$/, ''), { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Généré le ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    const MAX = 1000;
    const table = {
      headers: columns,
      rows: rows.slice(0, MAX).map(r => columns.map(c => this.fitCell(r[c]))),
    } as any;

    // @ts-ignore pdfkit-table patch
    await doc.table(table, {
      prepareHeader: () => doc.fontSize(9).font('Helvetica-Bold'),
      prepareRow: () => doc.fontSize(8).font('Helvetica'),
      columnsSize: this.computeColumnSizes(
        columns.length,
        doc.page.width - doc.page.margins.left - doc.page.margins.right,
      ),
    });

    if (rows.length > MAX) {
      doc.moveDown(0.5);
      doc.fontSize(9).fillColor('gray').text(`Affichage limité à ${MAX} lignes sur ${rows.length}. Utilisez l’export CSV pour la totalité.`);
      doc.fillColor('black');
    }

    doc.end();
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });
    return path;
  }

  private async toExcelFile(columns: string[], rows: any[], filename: string): Promise<string> {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const path = join(EXPORT_DIR, filename);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export');

    worksheet.addRow(columns);

    rows.forEach(row => {
      const rowData = columns.map(col => row[col]);
      worksheet.addRow(rowData);
    });

    // ✅ Correction TS2722 : vérifier si chaque colonne est bien définie
worksheet.columns?.forEach(col => {
  if (!col?.eachCell) return;

  let max = 10;
  col.eachCell({ includeEmpty: true }, cell => {
    max = Math.max(max, (cell.value?.toString()?.length ?? 0) + 2);
  });
  col.width = max;
});


    await workbook.xlsx.writeFile(path);
    return path;
  }

  private async writeFile(format: ExportFormat, dbName: string, columns: string[], rows: any[], suffix: string) {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const filenameBase = `${dbName}_${suffix}_${TS()}`;

    if (format === 'csv') {
      const csv = this.toCsv(columns, rows);
      const filename = `${filenameBase}.csv`;
      const path = join(EXPORT_DIR, filename);
      await fs.writeFile(path, csv, 'utf8');
      return { path, filename, mime: 'text/csv; charset=utf-8' };
    }

    if (format === 'xlsx') {
      const filename = `${filenameBase}.xlsx`;
      const path = await this.toExcelFile(columns, rows, filename);
      return { path, filename, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }

    const filename = `${filenameBase}.pdf`;
    const path = await this.toPdfFile(columns, rows, filename);
    return { path, filename, mime: 'application/pdf' };
  }

  async exportInfrastructures(req: any, format: ExportFormat) {
    const communeId = this.getUserCommuneIdOrThrow(req);
    const dbName = 'Infrastructure';
    const columns = await this.getDbColumns(dbName);

    const rowsRaw = await this.prisma.infrastructure.findMany({
      where: communeId ? { communeId } : {},
      orderBy: { created_at: 'desc' },
    });
    const rows = this.serializeRows(rowsRaw);

    return this.writeFile(format, dbName, columns, rows, communeId ? `commune_${communeId}` : 'all');
  }

  async exportCommunes(req: any, format: ExportFormat) {
    const communeId = this.getUserCommuneIdOrThrow(req);
    const dbName = 'Commune';
    const columns = await this.getDbColumns(dbName);

    const rowsRaw = await this.prisma.commune.findMany({
      where: communeId ? { id: communeId } : {},
    });
    const rows = this.serializeRows(rowsRaw);

    return this.writeFile(format, dbName, columns, rows, communeId ? `id_${communeId}` : 'all');
  }

  async exportUtilisateurs(req: any, format: ExportFormat) {
    const communeId = this.getUserCommuneIdOrThrow(req);
    const dbName = 'Utilisateur';
    const columns = await this.getDbColumns(dbName);

    const rowsRaw = await this.prisma.utilisateur.findMany({
      where: communeId ? { communeId } : {},
      orderBy: { created_at: 'desc' },
    });
    const rows = this.serializeRows(rowsRaw);

    return this.writeFile(format, dbName, columns, rows, communeId ? `commune_${communeId}` : 'all');
  }

  async exportTypeInfrastructures(format: ExportFormat) {
    const dbName = 'TypeInfrastructure';
    const columns = await this.getDbColumns(dbName);

    const rowsRaw = await this.prisma.typeInfrastructure.findMany({
      orderBy: { id: 'asc' },
    });
    const rows = this.serializeRows(rowsRaw);

    return this.writeFile(format, dbName, columns, rows, 'all');
  }
}
