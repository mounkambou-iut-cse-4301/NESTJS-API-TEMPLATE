import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { join } from 'path';
import { promises as fs } from 'fs';
import * as ExcelJS from 'exceljs';

// pdfmake côté serveur (PdfPrinter)
const PdfPrinter = require('pdfmake');
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};
const printer = new PdfPrinter(fonts);

export type ExportFormat = 'csv' | 'pdf' | 'xlsx';
type PdfOrientation = 'portrait' | 'landscape';

const EXPORT_DIR = join(process.cwd(), 'exports');
const TS = () => new Date().toISOString().replace(/[:.]/g, '-');

// ⬇️ Choix par défaut : PORTRAIT (au lieu de paysage)
const DEFAULT_PDF_ORIENTATION: PdfOrientation = 'portrait';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  /* =========================
     Helpers génériques
     ========================= */

  private getUserCommuneIdOrThrow(req: any): number | null {
    const communeId = req?.user?.communeId;
    return communeId ? Number(communeId) : null;
  }

  /** Normalise pour export: bigint -> string, Date -> ISO, object -> JSON */
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

  /* =========================
     PDF multi-tableaux & page auto (A4/A3/A2) + ORIENTATION paramétrable
     ========================= */

  private async toPdfFile(
    columns: string[],
    rows: any[],
    filename: string,
    orientation: PdfOrientation = DEFAULT_PDF_ORIENTATION,
  ): Promise<string> {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const path = join(EXPORT_DIR, filename);

    // Marges (points) : [g, h, d, b]
    const pageMargins: [number, number, number, number] = [18, 18, 18, 24];

    // Largeur utile (points, 72pt = 1") selon orientation
    const PAGE_WIDTHS = {
      portrait: { A4: 595, A3: 842, A2: 1191 },
      landscape: { A4: 842, A3: 1191, A2: 1684 },
    } as const;

    // Largeur mini souhaitée par colonne pour garder lisible
    const MIN_COL_WIDTH_PT = 60;

    // Choix de la taille de page en fonction du nombre de colonnes et de l'orientation
    const pickPageSize = (cols: number, ori: PdfOrientation): 'A4' | 'A3' | 'A2' => {
      const sizes: Array<'A4' | 'A3' | 'A2'> = ['A4', 'A3', 'A2'];
      for (const s of sizes) {
        const pageWidth = PAGE_WIDTHS[ori][s];
        const availableWidth = pageWidth - (pageMargins[0] + pageMargins[2]);
        const cap = Math.floor(availableWidth / MIN_COL_WIDTH_PT);
        if (cols <= cap) return s;
      }
      return 'A2';
    };

    const pageSize = pickPageSize(columns.length, orientation);
    const pageWidth = PAGE_WIDTHS[orientation][pageSize];
    const availableWidth = pageWidth - (pageMargins[0] + pageMargins[2]);

    // Nombre de colonnes affichables par tableau
    const colsPerTable = Math.max(1, Math.floor(availableWidth / MIN_COL_WIDTH_PT));

    // Découpage en groupes de colonnes qui tiennent sur la page choisie
    const groups: string[][] = [];
    for (let i = 0; i < columns.length; i += colsPerTable) {
      groups.push(columns.slice(i, i + colsPerTable));
    }

    // En-tête
    const content: any[] = [
      { text: filename.replace(/\.pdf$/, ''), style: 'header' },
      { text: `Généré le ${new Date().toLocaleString('fr-FR')}`, style: 'subheader' },
    ];

    // Tables par groupe de colonnes (saut de page avant chaque groupe > 0)
    groups.forEach((group, idx) => {
      const body = [
        group.map(col => ({ text: col, style: 'tableHeader' })),
        ...rows.slice(0, 2000).map(row =>
          group.map(col => ({
            text: this.fitCell(row[col]),
            style: 'tableCell',
            noWrap: false, // autorise l'enroulement
          })),
        ),
      ];

      content.push({
        table: {
          headerRows: 1,
          widths: group.map(() => '*'), // partage équitable de l'espace
          body,
        },
        layout: 'lightHorizontalLines',
        margin: [0, idx === 0 ? 10 : 0, 0, 18],
        ...(idx > 0 ? { pageBreak: 'before' } : {}),
      });
    });

    // Aide
    content.push({
      text: 'Astuce : pour parcourir toutes les colonnes librement, utilisez l’export CSV ou XLSX.',
      margin: [0, 6, 0, 0],
      style: 'hint',
    });

    const documentDefinition: any = {
      pageOrientation: orientation, // ⬅️ portrait par défaut
      pageSize,                     // 'A4' | 'A3' | 'A2'
      pageMargins,
      content,
      styles: {
        header: { fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
        subheader: { fontSize: 9, margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, fontSize: 8, fillColor: '#f5f5f5' },
        tableCell: { fontSize: 7 },
        hint: { fontSize: 8, color: '#666' },
      },
      defaultStyle: { font: 'Helvetica' },
    };

    const pdfDoc = printer.createPdfKitDocument(documentDefinition);
    pdfDoc.end();

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', async () => {
        try {
          await fs.writeFile(path, Buffer.concat(chunks));
          resolve(path);
        } catch (err) {
          reject(err);
        }
      });
      pdfDoc.on('error', reject);
    });
  }

  /* =========================
     XLSX
     ========================= */

  private async toExcelFile(columns: string[], rows: any[], filename: string): Promise<string> {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const path = join(EXPORT_DIR, filename);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export');

    // Définition explicite des colonnes (header + key)
    worksheet.columns = columns.map(c => ({ header: c, key: c }));

    // Ajout des lignes (objets clé->valeur)
    rows.forEach(row => worksheet.addRow(row));

    // Autosize simple & borné
    worksheet.columns?.forEach(col => {
      if (!col?.eachCell) return;
      let max = (col.header?.toString()?.length ?? 10) + 2;
      col.eachCell({ includeEmpty: true }, cell => {
        const len = (cell.value?.toString()?.length ?? 0) + 2;
        if (len > max) max = len;
      });
      col.width = Math.min(Math.max(max, 10), 60);
    });

    await workbook.xlsx.writeFile(path);
    return path;
  }

  /* =========================
     Écriture disque selon format
     ========================= */

  private async writeFile(
    format: ExportFormat,
    dbName: string,
    columns: string[],
    rows: any[],
    suffix: string,
    orientation: PdfOrientation = DEFAULT_PDF_ORIENTATION, // ⬅️ param orientation
  ) {
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

    // PDF
    const filename = `${filenameBase}.pdf`;
    const path = await this.toPdfFile(columns, rows, filename, orientation);
    return { path, filename, mime: 'application/pdf' };
  }

  /* =========================
     Export — Infrastructures
     ========================= */

  async exportInfrastructures(req: any, format: ExportFormat) {
    const communeId = this.getUserCommuneIdOrThrow(req);

    const columns = [
      'id',
      'id_parent',
      'parent',
      'name',
      'description',
      'type',
      'existing_infrastructure',
      'type_modele',
      'type_modele_nature',
      'domaine',
      'sousdomaine',
      'competence',
      'region',
      'departement',
      'arrondissement',
      'commune',
      'utilisateur',
      'location',
      'images',
      'attribus',
      'composant',
      'created_at',
      'updated_at',
    ];

    const rowsRaw = await this.prisma.infrastructure.findMany({
      where: communeId ? { communeId } : {},
      orderBy: { created_at: 'desc' },
      include: {
        parent: { select: { id: true, name: true } },
        typeRef: { select: { id: true, name: true, type: true } },
        domaine: { select: { nom: true } },
        sousdomaine: { select: { nom: true } },
        competence: { select: { name: true } },
        region: { select: { nom: true } },
        departement: { select: { nom: true } },
        arrondissement: { select: { nom: true } },
        commune: { select: { nom: true } },
        utilisateur: { select: { nom: true, email: true } },
      },
    });

    const flat = rowsRaw.map(r => ({
      id: typeof r.id === 'bigint' ? r.id.toString() : (r as any).id,
      id_parent: typeof (r as any).id_parent === 'bigint'
        ? (r as any).id_parent.toString()
        : ((r as any).id_parent ?? ''),
      parent: (r as any).parent?.name ?? '',
      name: r.name,
      description: r.description ?? '',
      type: r.type,
      existing_infrastructure: r.existing_infrastructure,
      type_modele: (r as any).typeRef?.name ?? '',
      type_modele_nature: (r as any).typeRef?.type ?? '',
      domaine: (r as any).domaine?.nom ?? '',
      sousdomaine: (r as any).sousdomaine?.nom ?? '',
      competence: (r as any).competence?.name ?? '',
      region: (r as any).region?.nom ?? '',
      departement: (r as any).departement?.nom ?? '',
      arrondissement: (r as any).arrondissement?.nom ?? '',
      commune: (r as any).commune?.nom ?? '',
      utilisateur: r['utilisateur']?.email ?? r['utilisateur']?.nom ?? '',
      location: r.location ?? null,
      images: r.images ?? null,
      attribus: r.attribus ?? null,
      composant: r.composant ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    const rows = this.serializeRows(flat);
    return this.writeFile(format, 'Infrastructure', columns, rows, communeId ? `commune_${communeId}` : 'all');
  }

  /* =========================
     Export — Communes
     ========================= */

  async exportCommunes(req: any, format: ExportFormat) {
    const communeId = this.getUserCommuneIdOrThrow(req);

    const columns = [
      'id',
      'nom',
      'nom_en',
      'nom_maire',
      'longitude',
      'latitude',
      'code',
      'region',
      'departement',
      'arrondissement',
      'type_commune',
      'is_verified',
      'is_block',
      'created_at',
      'updated_at',
    ];

    const rowsRaw = await this.prisma.commune.findMany({
      where: communeId ? { id: communeId } : {},
      include: {
        region: { select: { nom: true } },
        departement: { select: { nom: true } },
        arrondissement: { select: { nom: true } },
        typeCommune: { select: { name: true } },
      },
      orderBy: { id: 'asc' },
    });

    const flat = rowsRaw.map(r => ({
      id: r.id,
      nom: r.nom,
      nom_en: r.nom_en ?? '',
      nom_maire: r.nom_maire ?? '',
      longitude: r.longitude ?? '',
      latitude: r.latitude ?? '',
      code: r.code ?? '',
      region: (r as any).region?.nom ?? '',
      departement: (r as any).departement?.nom ?? '',
      arrondissement: (r as any).arrondissement?.nom ?? '',
      type_commune: (r as any).typeCommune?.name ?? '',
      is_verified: r.is_verified,
      is_block: r.is_block,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    const rows = this.serializeRows(flat);
    return this.writeFile(format, 'Commune', columns, rows, communeId ? `id_${communeId}` : 'all');
  }

  /* =========================
     Export — Utilisateurs
     ========================= */

  async exportUtilisateurs(req: any, format: ExportFormat) {
    const communeId = this.getUserCommuneIdOrThrow(req);

    const columns = [
      'id',
      'nom',
      'email',
      'telephone',
      'commune',
      'roles',
      'is_verified',
      'is_block',
      'derniere_connexion',
      'created_at',
      'updated_at',
    ];

    const rowsRaw = await this.prisma.utilisateur.findMany({
      where: communeId ? { communeId } : {},
      orderBy: { created_at: 'desc' },
      include: {
        commune: { select: { nom: true } },
        roles: { include: { role: { select: { nom: true } } } },
      },
    });

    const flat = rowsRaw.map(r => ({
      id: r.id,
      nom: r.nom,
      email: r.email,
      telephone: r.telephone,
      commune: (r as any).commune?.nom ?? '',
      roles: ((r as any).roles ?? [])
        .map((x: any) => x.role?.nom)
        .filter(Boolean)
        .join(' | '),
      is_verified: r.is_verified,
      is_block: r.is_block,
      derniere_connexion: r.derniere_connexion ?? '',
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    const rows = this.serializeRows(flat);
    return this.writeFile(format, 'Utilisateur', columns, rows, communeId ? `commune_${communeId}` : 'all');
  }

  /* =========================
     Export — Types d'infrastructure (modèles)
     ========================= */

  async exportTypeInfrastructures(format: ExportFormat) {
    const columns = [
      'id',
      'name',
      'type',
      'description',
      'domaine',
      'sousdomaine',
      'competence',
      'location',
      'images',
      'attribus',
      'composant',
      'created_at',
      'updated_at',
    ];

    const rowsRaw = await this.prisma.typeInfrastructure.findMany({
      orderBy: { id: 'asc' },
      include: {
        domaine: { select: { nom: true } },
        sousdomaine: { select: { nom: true } },
        competence: { select: { name: true } },
      },
    });

    const flat = rowsRaw.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      description: r.description ?? '',
      domaine: (r as any).domaine?.nom ?? '',
      sousdomaine: (r as any).sousdomaine?.nom ?? '',
      competence: (r as any).competence?.name ?? '',
      location: r.location ?? null,
      images: r.images ?? null,
      attribus: r.attribus ?? null,
      composant: r.composant ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    const rows = this.serializeRows(flat);
    return this.writeFile(format, 'TypeInfrastructure', columns, rows, 'all');
  }
}
