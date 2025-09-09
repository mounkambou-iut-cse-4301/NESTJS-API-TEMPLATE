// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import * as ExcelJS from 'exceljs';
// const PdfPrinter = require('pdfmake');

// const fonts = {
//   Helvetica: {
//     normal: 'Helvetica',
//     bold: 'Helvetica-Bold',
//     italics: 'Helvetica-Oblique',
//     bolditalics: 'Helvetica-BoldOblique',
//   },
// };
// const printer = new PdfPrinter(fonts);

// type PageQuery = { page?: number; pageSize?: number; q?: string };
// type InfraListQuery = PageQuery & { typeId?: number; communeId?: number };
// type ExportQuery = { typeId?: number; communeId?: number; format?: 'csv' | 'xlsx' | 'pdf' };
// type SummaryQuery = { communeId?: number };
// type TypesBreakdownQuery = { communeId?: number };

// function meta(page: number, pageSize: number, total: number) {
//   return {
//     page,
//     pageSize,
//     total,
//     totalPages: Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
//   };
// }

// function csvEscape(v: any) {
//   const s = String(v ?? '');
//   return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
// }

// function toCSV(headers: string[], rows: (string | number | null | undefined)[][]) {
//   const head = headers.join(',');
//   const body = rows.map((r) => r.map((c) => csvEscape(c)).join(',')).join('\n');
//   return [head, body].join('\n');
// }

// // Mapping de l’état (attribus.etat) vers un score %
// const ETAT_SCORE: Record<string, number> = {
//   excellent: 100,
//   bon: 75,
//   passable: 50,
//   mauvais: 25,
//   'tres mauvais': 0,
// };

// @Injectable()
// export class PortailsService {
//   constructor(private readonly prisma: PrismaService) {}

//   /* =======================================================
//    * 1) Tous les types d’infrastructure
//    * ======================================================= */
//   async getAllTypes() {
//     const rows = await this.prisma.typeInfrastructure.findMany({
//       orderBy: { id: 'asc' },
//       include: {
//         domaine: { select: { id: true, nom: true } },
//         sousdomaine: { select: { id: true, nom: true } },
//         competence: { select: { id: true, name: true } },
//       },
//     });
//     return {
//       message: 'Types récupérés.',
//       messageE: 'Types fetched.',
//       data: rows.map((t) => ({
//         id: t.id,
//         name: t.name,
//         type: t.type, // SIMPLE|COMPLEXE (modèle)
//         domaine: t.domaine?.nom ?? null,
//         sousdomaine: t.sousdomaine?.nom ?? null,
//         competence: t.competence?.name ?? null,
//       })),
//     };
//   }

//   /* =======================================================
//    * 1-bis) Liste publique des infrastructures (pagination)
//    *   Colonnes: Nom, Type, Commune, Date de mise à jour, Responsable
//    * ======================================================= */
//   async listInfrasPublic(q: InfraListQuery) {
//     const page = Math.max(1, Number(q.page ?? 1));
//     const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 200);

//     const where: any = {
//         id_parent:null
//     };
//     if (q.typeId) where.id_type_infrastructure = Number(q.typeId);
//     if (q.communeId) where.communeId = Number(q.communeId);
//     if (q.q) {
//       where.OR = [
//         { name: { contains: q.q, mode: 'insensitive' } },
//         { description: { contains: q.q, mode: 'insensitive' } },
//       ];
//     }

//     const [total, rows] = await this.prisma.$transaction([
//       this.prisma.infrastructure.count({ where }),
//       this.prisma.infrastructure.findMany({
//         where,
//         orderBy: { updated_at: 'desc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true,
//           name: true,
//           updated_at: true,
//           commune: { select: { id: true, nom: true } },
//           typeRef: { select: { id: true, name: true } },
//           utilisateur: { select: { id: true, nom: true, email: true } },
//         },
//       }),
//     ]);

//     const data = rows.map((r) => ({
//       id: typeof r.id === 'bigint' ? r.id.toString() : r.id,
//       nom: r.name,
//       type: r.typeRef?.name ?? '',
//       commune: r.commune?.nom ?? '',
//       date_mise_a_jour: r.updated_at,
//       responsable: r.utilisateur?.nom ?? r.utilisateur?.email ?? '',
//     }));

//     return {
//       message: 'Infrastructures publiques.',
//       messageE: 'Public infrastructures.',
//       data,
//       meta: meta(page, pageSize, total),
//       columns: ['Nom', 'Type', 'Commune', 'Date de mise à jour', 'Responsable'],
//     };
//   }

//   /* =======================================================
//    * 2) Export public (CSV/XLSX/PDF) des infrastructures
//    * ======================================================= */
//   private async exportRows(q: ExportQuery) {
//     // réutilise la même sélection que listInfrasPublic mais sans pagination
//     const where: any = {};
//     if (q.typeId) where.id_type_infrastructure = Number(q.typeId);
//     if (q.communeId) where.communeId = Number(q.communeId);

//     const rows = await this.prisma.infrastructure.findMany({
//       where,
//       orderBy: { updated_at: 'desc' },
//       select: {
//         name: true,
//         updated_at: true,
//         commune: { select: { nom: true } },
//         typeRef: { select: { name: true } },
//         utilisateur: { select: { nom: true, email: true } },
//       },
//     });

//     const headers = ['Nom', 'Type', 'Commune', 'Date de mise à jour', 'Responsable'];
//     const data = rows.map((r) => [
//       r.name,
//       r.typeRef?.name ?? '',
//       r.commune?.nom ?? '',
//       r.updated_at?.toISOString?.() ?? '',
//       r.utilisateur?.nom ?? r.utilisateur?.email ?? '',
//     ]);

//     return { headers, data };
//   }

//   private async toXlsxBuffer(headers: string[], data: any[][]) {
//     const wb = new ExcelJS.Workbook();
//     const ws = wb.addWorksheet('Infrastructures');
//     ws.addRow(headers);
//     data.forEach((row) => ws.addRow(row));
//     ws.columns?.forEach((col) => {
//       if (!col?.eachCell) return;
//       let max = String(col.header ?? '').length + 2;
//       col.eachCell({ includeEmpty: true }, (cell) => {
//         const len = String(cell.value ?? '').length + 2;
//         if (len > max) max = len;
//       });
//       col.width = Math.min(Math.max(max, 10), 60);
//     });
//     return wb.xlsx.writeBuffer();
//   }

//   private async toPdfBuffer(headers: string[], data: any[][], title = 'Infrastructures') {
//     const body = [headers, ...data];
//     const docDef = {
//       pageOrientation: 'portrait',
//       defaultStyle: { font: 'Helvetica' },
//       content: [
//         { text: title, style: 'header' },
//         { text: `Généré le ${new Date().toLocaleString('fr-FR')}`, style: 'subheader' },
//         {
//           table: {
//             headerRows: 1,
//             widths: headers.map(() => '*'),
//             body,
//           },
//           layout: 'lightHorizontalLines',
//           margin: [0, 10, 0, 0],
//         },
//       ],
//       styles: {
//         header: { fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
//         subheader: { fontSize: 9, margin: [0, 0, 0, 12] },
//       },
//     };

//     const pdfDoc = printer.createPdfKitDocument(docDef);
//     pdfDoc.end();

//     const chunks: Buffer[] = [];
//     return await new Promise<Buffer>((resolve, reject) => {
//       pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
//       pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
//       pdfDoc.on('error', reject);
//     });
//   }

//   async exportInfrasPublic(q: ExportQuery) {
//     const format = (q.format ?? 'csv').toLowerCase() as 'csv' | 'xlsx' | 'pdf';
//     const { headers, data } = await this.exportRows(q);

//     if (format === 'xlsx') {
//       const buffer = await this.toXlsxBuffer(headers, data);
//       return {
//         filename: 'infrastructures_public.xlsx',
//         mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         buffer,
//       };
//     }

//     if (format === 'pdf') {
//       const buffer = await this.toPdfBuffer(headers, data, 'Infrastructures publiques');
//       return {
//         filename: 'infrastructures_public.pdf',
//         mime: 'application/pdf',
//         buffer,
//       };
//     }

//     const csv = toCSV(headers, data);
//     return {
//       filename: 'infrastructures_public.csv',
//       mime: 'text/csv; charset=utf-8',
//       buffer: Buffer.from(csv, 'utf8'),
//     };
//   }

//   /* =======================================================
//    * 3) Résumé public
//    *  - total infrastructures
//    *  - condition moyenne (attribus.etat -> %)
//    *  - dernière mise à jour
//    *  - filtre optionnel par commune
//    * ======================================================= */
//   async summaryPublic(q: SummaryQuery) {
//     console.log('communeId:', q);
//     const where: any = {};
//     if (q.communeId) where.communeId = Number(q.communeId);

//     // total + dernière MAJ
//     const [total, lastAgg] = await this.prisma.$transaction([
//       this.prisma.infrastructure.count({ where }),
//       this.prisma.infrastructure.aggregate({ where, _max: { updated_at: true } }),
//     ]);

//     // distribution par etat (SQL brut léger)
//     const parts: string[] = [];
//     if (q.communeId) parts.push(`communeId=${Number(q.communeId)}`);
//     const W = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
//     const byEtatRows: Array<{ etat: string | null; c: any }> =
//       await this.prisma.$queryRawUnsafe(`
//         SELECT LOWER(JSON_UNQUOTE(JSON_EXTRACT(attribus, '$.etat'))) AS etat, COUNT(*) AS c
//         FROM Infrastructure
//         ${W}
//         GROUP BY etat;
//       `);

//     // condition moyenne (%)
//     let sumScore = 0;
//     let sumCount = 0;
//     const repartition_etat = (byEtatRows || []).map((r) => {
//       const key = (r.etat ?? '').toString().trim();
//       const c = Number(r.c ?? 0);
//       const score = ETAT_SCORE[key] ?? null;
//       if (score !== null) {
//         sumScore += score * c;
//         sumCount += c;
//       }
//       return { etat: key || null, count: c };
//     });
//     const condition_moyenne = sumCount ? +(sumScore / sumCount).toFixed(2) : null;

//     return {
//       message: 'Résumé (public).',
//       data: {
//         total_infrastructures: total,
//         condition_moyenne_percent: condition_moyenne, // ex: 72.5
//         derniere_mise_a_jour: lastAgg._max.updated_at ?? null,
//         repartition_etat, // bonus utile au front
//       },
//     };
//   }

//   /* =======================================================
//    * 4) Lister les communes (pagination + recherche)
//    * ======================================================= */
//   async listCommunes(q: PageQuery) {
//     const page = Math.max(1, Number(q.page ?? 1));
//     const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 200);

//     const where: any = {};
//     if (q.q) {
//       where.OR = [
//         { nom: { contains: q.q, mode: 'insensitive' } },
//         { code: { contains: q.q, mode: 'insensitive' } },
//       ];
//     }

//     const [total, rows] = await this.prisma.$transaction([
//       this.prisma.commune.count({ where }),
//       this.prisma.commune.findMany({
//         where,
//         orderBy: { nom: 'asc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true,
//           nom: true,
//           code: true,
//           region: { select: { id: true, nom: true } },
//           departement: { select: { id: true, nom: true} },
//           arrondissement: { select: { id: true, nom: true } },
//         },
//       }),
//     ]);

//     const data = rows.map((c) => ({
//       id: c.id,
//       nom: c.nom,
//       code: c.code ?? '',
//       region: c.region?.nom ?? '',
//       departement: c.departement?.nom ?? '',
//       arrondissement: c.arrondissement?.nom ?? '',
//     }));

//     return {
//       message: 'Communes (public).',
//       data,
//       meta: meta(page, pageSize, total),
//     };
//   }

//   /* =======================================================
//    * 5) Répartition par type (public)
//    * - total
//    * - par type: count + pourcentage
//    * - filtre optionnel communeId
//    * ======================================================= */
//   async typesBreakdownPublic(q: TypesBreakdownQuery) {
//     const where: any = {};
//     if (q.communeId) where.communeId = Number(q.communeId);

//     const total = await this.prisma.infrastructure.count({ where });
//     if (!total) {
//       return {
//         message: 'Répartition par type (public).',
//         data: { total: 0, items: [] as any[] },
//       };
//     }

//     const grouped = await this.prisma.infrastructure.groupBy({
//       by: ['id_type_infrastructure'],
//       where,
//       orderBy: { id_type_infrastructure: 'asc' },
//       _count: { _all: true },
//     });

//     const typeIds = grouped.map((g) => g.id_type_infrastructure);
//     const types = await this.prisma.typeInfrastructure.findMany({
//       where: { id: { in: typeIds } },
//       select: { id: true, name: true },
//     });
//     const map = new Map(types.map((t) => [t.id, t.name]));

//     const items = grouped.map((g) => {
//       const count = g._count?._all ?? 0;
//       const pct = +(count * 100 / total).toFixed(2);
//       return {
//         typeId: g.id_type_infrastructure,
//         type: map.get(g.id_type_infrastructure) ?? '',
//         count,
//         percent: pct,
//       };
//     });

//     return {
//       message: 'Répartition par type (public).',
//       data: { total, items },
//     };
//   }
// }
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
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

type PageQuery = { page?: number; pageSize?: number; q?: string };
type InfraListQuery = PageQuery & { typeId?: number; communeId?: number };
type ExportQuery = { typeId?: number; communeId?: number; format?: 'csv' | 'xlsx' | 'pdf' };
type SummaryQuery = { communeId?: number };
type TypesBreakdownQuery = { communeId?: number };

function meta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
  };
}

function csvEscape(v: any) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]) {
  const head = headers.join(',');
  const body = rows.map((r) => r.map((c) => csvEscape(c)).join(',')).join('\n');
  return [head, body].join('\n');
}

// Mapping de l’état (attribus.etat) vers un score %
const ETAT_SCORE: Record<string, number> = {
  excellent: 100,
  bon: 75,
  passable: 50,
  mauvais: 25,
  'tres mauvais': 0,
};

@Injectable()
export class PortailsService {
  constructor(private readonly prisma: PrismaService) {}

  /* =======================================================
   * 1) Tous les types d’infrastructure
   * ======================================================= */
  async getAllTypes() {
    const rows = await this.prisma.typeInfrastructure.findMany({
      orderBy: { id: 'asc' },
      include: {
        domaine: { select: { id: true, nom: true } },
        sousdomaine: { select: { id: true, nom: true } },
        competence: { select: { id: true, name: true } },
      },
    });
    return {
      message: 'Types récupérés.',
      messageE: 'Types fetched.',
      data: rows.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type, // SIMPLE|COMPLEXE (modèle)
        domaine: t.domaine?.nom ?? null,
        sousdomaine: t.sousdomaine?.nom ?? null,
        competence: t.competence?.name ?? null,
      })),
    };
  }

  /* =======================================================
   * 1-bis) Liste publique des infrastructures (pagination)
   * ======================================================= */
  async listInfrasPublic(q: InfraListQuery) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 200);

    const where: any = {
      id_parent: null,
    };
    if (q.typeId) where.id_type_infrastructure = Number(q.typeId);
    if (q.communeId) where.communeId = Number(q.communeId);
    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.infrastructure.count({ where }),
      this.prisma.infrastructure.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          updated_at: true,
          commune: { select: { id: true, nom: true } },
          typeRef: { select: { id: true, name: true } },
          utilisateur: { select: { id: true, nom: true, email: true } },
        },
      }),
    ]);

    const data = rows.map((r) => ({
      id: typeof r.id === 'bigint' ? r.id.toString() : r.id,
      nom: r.name,
      type: r.typeRef?.name ?? '',
      commune: r.commune?.nom ?? '',
      date_mise_a_jour: r.updated_at,
      responsable: r.utilisateur?.nom ?? r.utilisateur?.email ?? '',
    }));

    return {
      message: 'Infrastructures publiques.',
      messageE: 'Public infrastructures.',
      data,
      meta: meta(page, pageSize, total),
      columns: ['Nom', 'Type', 'Commune', 'Date de mise à jour', 'Responsable'],
    };
  }

  /* =======================================================
   * 2) Export public (CSV/XLSX/PDF) des infrastructures
   * ======================================================= */
  private async exportRows(q: ExportQuery) {
    const where: any = {};
    if (q.typeId) where.id_type_infrastructure = Number(q.typeId);
    if (q.communeId) where.communeId = Number(q.communeId);

    const rows = await this.prisma.infrastructure.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      select: {
        name: true,
        updated_at: true,
        commune: { select: { nom: true } },
        typeRef: { select: { name: true } },
        utilisateur: { select: { nom: true, email: true } },
      },
    });

    const headers = ['Nom', 'Type', 'Commune', 'Date de mise à jour', 'Responsable'];
    const data = rows.map((r) => [
      r.name,
      r.typeRef?.name ?? '',
      r.commune?.nom ?? '',
      r.updated_at?.toISOString?.() ?? '',
      r.utilisateur?.nom ?? r.utilisateur?.email ?? '',
    ]);

    return { headers, data };
  }

  private async toXlsxBuffer(headers: string[], data: any[][]) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Infrastructures');
    ws.addRow(headers);
    data.forEach((row) => ws.addRow(row));
    ws.columns?.forEach((col) => {
      if (!col?.eachCell) return;
      let max = String(col.header ?? '').length + 2;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = String(cell.value ?? '').length + 2;
        if (len > max) max = len;
      });
      col.width = Math.min(Math.max(max, 10), 60);
    });
    return wb.xlsx.writeBuffer();
  }

  private async toPdfBuffer(headers: string[], data: any[][], title = 'Infrastructures') {
    const body = [headers, ...data];
    const docDef = {
      pageOrientation: 'portrait',
      defaultStyle: { font: 'Helvetica' },
      content: [
        { text: title, style: 'header' },
        { text: `Généré le ${new Date().toLocaleString('fr-FR')}`, style: 'subheader' },
        {
          table: {
            headerRows: 1,
            widths: headers.map(() => '*'),
            body,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 10, 0, 0],
        },
      ],
      styles: {
        header: { fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
        subheader: { fontSize: 9, margin: [0, 0, 0, 12] },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDef);
    pdfDoc.end();

    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
    });
  }

  async exportInfrasPublic(q: ExportQuery) {
    const format = (q.format ?? 'csv').toLowerCase() as 'csv' | 'xlsx' | 'pdf';
    const { headers, data } = await this.exportRows(q);

    if (format === 'xlsx') {
      const buffer = await this.toXlsxBuffer(headers, data);
      return {
        filename: 'infrastructures_public.xlsx',
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer,
      };
    }

    if (format === 'pdf') {
      const buffer = await this.toPdfBuffer(headers, data, 'Infrastructures publiques');
      return {
        filename: 'infrastructures_public.pdf',
        mime: 'application/pdf',
        buffer,
      };
    }

    const csv = toCSV(headers, data);
    return {
      filename: 'infrastructures_public.csv',
      mime: 'text/csv; charset=utf-8',
      buffer: Buffer.from(csv, 'utf8'),
    };
  }

  /* =======================================================
   * 3) Résumé public
   * ======================================================= */
  async summaryPublic(q: SummaryQuery) {
    const where: any = {};
    if (q.communeId) where.communeId = Number(q.communeId);

    const [total, lastAgg] = await this.prisma.$transaction([
      this.prisma.infrastructure.count({ where }),
      this.prisma.infrastructure.aggregate({ where, _max: { updated_at: true } }),
    ]);

    // PostgreSQL: JSON ->> 'etat'  + paramétrage sécurisé
    // WHERE ( $1::int IS NULL OR "communeId" = $1 )
    const paramCommune = q.communeId ?? null;
    const byEtatRows: Array<{ etat: string | null; c: any }> =
      await this.prisma.$queryRaw`
        SELECT lower( ("attribus" ->> 'etat') ) AS etat, COUNT(*) AS c
        FROM "Infrastructure"
        WHERE (${paramCommune}::int IS NULL OR "communeId" = ${paramCommune})
        GROUP BY 1
      `;

    let sumScore = 0;
    let sumCount = 0;
    const repartition_etat = (byEtatRows || []).map((r) => {
      const key = (r.etat ?? '').toString().trim();
      const c = Number(r.c ?? 0);
      const score = ETAT_SCORE[key] ?? null;
      if (score !== null) {
        sumScore += score * c;
        sumCount += c;
      }
      return { etat: key || null, count: c };
    });
    const condition_moyenne = sumCount ? +(sumScore / sumCount).toFixed(2) : null;

    return {
      message: 'Résumé (public).',
      data: {
        total_infrastructures: total,
        condition_moyenne_percent: condition_moyenne,
        derniere_mise_a_jour: lastAgg._max.updated_at ?? null,
        repartition_etat,
      },
    };
  }

  /* =======================================================
   * 4) Lister les communes (pagination + recherche)
   * ======================================================= */
  async listCommunes(q: PageQuery) {
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(Math.max(1, Number(q.pageSize ?? 20)), 200);

    const where: any = {};
    if (q.q) {
      where.OR = [
        { nom: { contains: q.q, mode: 'insensitive' } },
        { code: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.commune.count({ where }),
      this.prisma.commune.findMany({
        where,
        orderBy: { nom: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          nom: true,
          code: true,
          region: { select: { id: true, nom: true } },
          departement: { select: { id: true, nom: true} },
          arrondissement: { select: { id: true, nom: true } },
        },
      }),
    ]);

    const data = rows.map((c) => ({
      id: c.id,
      nom: c.nom,
      code: c.code ?? '',
      region: c.region?.nom ?? '',
      departement: c.departement?.nom ?? '',
      arrondissement: c.arrondissement?.nom ?? '',
    }));

    return {
      message: 'Communes (public).',
      data,
      meta: meta(page, pageSize, total),
    };
  }

  /* =======================================================
   * 5) Répartition par type (public)
   * ======================================================= */
  async typesBreakdownPublic(q: TypesBreakdownQuery) {
    const where: any = {};
    if (q.communeId) where.communeId = Number(q.communeId);

    const total = await this.prisma.infrastructure.count({ where });
    if (!total) {
      return {
        message: 'Répartition par type (public).',
        data: { total: 0, items: [] as any[] },
      };
    }

    const grouped = await this.prisma.infrastructure.groupBy({
      by: ['id_type_infrastructure'],
      where,
      orderBy: { id_type_infrastructure: 'asc' },
      _count: { _all: true },
    });

    const typeIds = grouped.map((g) => g.id_type_infrastructure);
    const types = await this.prisma.typeInfrastructure.findMany({
      where: { id: { in: typeIds } },
      select: { id: true, name: true },
    });
    const map = new Map(types.map((t) => [t.id, t.name]));

    const items = grouped.map((g) => {
      const count = g._count?._all ?? 0;
      const pct = +(count * 100 / total).toFixed(2);
      return {
        typeId: g.id_type_infrastructure,
        type: map.get(g.id_type_infrastructure) ?? '',
        count,
        percent: pct,
      };
    });

    return {
      message: 'Répartition par type (public).',
      data: { total, items },
    };
  }
}
