import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/* ---------------- Types & helpers communs ---------------- */

type Scope = {
  level?: 'country'|'region'|'departement'|'arrondissement'|'commune';
  regionId?: number;
  departementId?: number;
  arrondissementId?: number;
  communeId?: number;
  typeId?: number;
  domaineId?: number;
  sousdomaineId?: number;
  from?: string;
  to?: string;
  group_by?: 'mois'|'trimestre'|'annee';
  limit?: number;
  max_age_days?: number;
  attr?: string;
  attrA?: string;
  attrB?: string;
};

type TypeStatsGeoInput = {
  typeId: number;
  regionId?: number;
  departementId?: number;
  arrondissementId?: number;
};

type EtatRow = { etat: string | null; c: any };

type Etat = 'EXCELLENT'|'BON'|'PASSABLE'|'MAUVAIS'|'TRES MAUVAIS';
const ALLOWED_ETATS: Etat[] = ['EXCELLENT','BON','PASSABLE','MAUVAIS','TRES MAUVAIS'];

function toStrId(id:any){ return typeof id === 'bigint' ? id.toString() : String(id); }

/** WHERE (Prisma) + scoping automatique par commune utilisateur si présent. */
function buildWhere(q: Scope, req?: any) {
  const where: any = {};
  if (q.regionId)         where.regionId = Number(q.regionId);
  if (q.departementId)    where.departementId = Number(q.departementId);
  if (q.arrondissementId) where.arrondissementId = Number(q.arrondissementId);
  if (q.communeId)        where.communeId = Number(q.communeId);
  if (q.typeId)           where.id_type_infrastructure = Number(q.typeId);
  if (q.domaineId)        where.domaineId = Number(q.domaineId);
  if (q.sousdomaineId)    where.sousdomaineId = Number(q.sousdomaineId);

  // 🔒 Scoping utilisateur : si l’utilisateur a une commune, on force le filtre communeId
  const userCommuneId = req?.user?.communeId as number | undefined;
  if (userCommuneId) {
    where.communeId = Number(userCommuneId);
  }
  return where;
}

/** WHERE (SQL-unsafe) limité aux colonnes numériques whitelistées. */
function sqlWhere(where: Record<string, any>) {
  const parts: string[] = [];
  for (const [k,v] of Object.entries(where)) {
    if (v === undefined || v === null) continue;
    if (['regionId','departementId','arrondissementId','communeId','id_type_infrastructure','domaineId','sousdomaineId'].includes(k)) {
      parts.push(`${k}=${Number(v)}`);
    }
  }
  return parts.length ? 'WHERE '+parts.join(' AND ') : '';
}

/* ------------------------- Service ------------------------- */

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Si req.user.communeId est défini, on récupère l’arrondissementId de la commune (pour les stats type). */
  private async getArrondissementFromUser(req?: any): Promise<number | null> {
    const communeId = req?.user?.communeId ? Number(req.user.communeId) : null;
    if (!communeId) return null;
    const c = await this.prisma.commune.findUnique({
      where: { id: communeId },
      select: { arrondissementId: true },
    });
    return c?.arrondissementId ?? null;
  }

  /** where parts SANS id_parent (on n’y touche pas). */
  private whereParts(q: TypeStatsGeoInput, userArrId?: number | null): string[] {
    const w: string[] = [`id_type_infrastructure=${Number(q.typeId)}`];
    if (q.regionId) w.push(`regionId=${Number(q.regionId)}`);
    if (q.departementId) w.push(`departementId=${Number(q.departementId)}`);
    if (q.arrondissementId) w.push(`arrondissementId=${Number(q.arrondissementId)}`);
    // scope utilisateur (arrondissement de sa commune)
    if (userArrId) w.push(`arrondissementId=${Number(userArrId)}`);
    return w;
  }
  private whereSQL(q: TypeStatsGeoInput, userArrId?: number | null): string {
    const parts = this.whereParts(q, userArrId);
    return parts.length ? `WHERE ${parts.join(' AND ')}` : '';
  }
  private andCond(base: string, cond: string): string {
    return base && base.trim().length ? `${base} AND ${cond}` : `WHERE ${cond}`;
  }

  /** Échappe une clé d’attribut JSON pour un chemin '$."...key..."'. */
  private escJsonKey(k: string) {
    return k.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "''");
  }

  /** WHERE Prisma équivalent (priorité au scope utilisateur si présent). */
  private prismaWhere(q: TypeStatsGeoInput, userArrId?: number | null) {
    const where: any = { id_type_infrastructure: Number(q.typeId) };
    if (q.regionId) where.regionId = Number(q.regionId);
    if (q.departementId) where.departementId = Number(q.departementId);
    if (q.arrondissementId) where.arrondissementId = Number(q.arrondissementId);
    if (userArrId) where.arrondissementId = Number(userArrId);
    return where;
  }

  /* -------- Métadonnées du type -------- */
  private async getTypeMeta(typeId: number) {
    const t = await this.prisma.typeInfrastructure.findUnique({
      where: { id: typeId },
      include: {
        domaine: { select: { nom: true } },
        sousdomaine: { select: { nom: true } },
        competence: { select: { name: true } },
      },
    });
    if (!t) return null;
    return {
      id: t.id,
      nom: t.name,
      nature: t.type, // SIMPLE | COMPLEXE
      domaine: t.domaine?.nom ?? null,
      sousdomaine: t.sousdomaine?.nom ?? null,
      competence: t.competence?.name ?? null,
    };
  }

  /** Expression SQL qui lit ETAT depuis attribus: $.etat ou $."ETAT", gère ARRAY -> 1er, et met en MAJ */
  private etatExprSQL(): string {
    return `
      UPPER(
        JSON_UNQUOTE(
          CASE
            WHEN JSON_TYPE(COALESCE(JSON_EXTRACT(attribus, '$.etat'), JSON_EXTRACT(attribus, '$."ETAT"'))) = 'ARRAY'
              THEN JSON_EXTRACT(COALESCE(JSON_EXTRACT(attribus, '$.etat'), JSON_EXTRACT(attribus, '$."ETAT"')), '$[0]')
            ELSE COALESCE(JSON_EXTRACT(attribus, '$.etat'), JSON_EXTRACT(attribus, '$."ETAT"'))
          END
        )
      )
    `;
  }

  /** Formate une liste de lignes {etat, c} en tableau complet selon ALLOWED_ETATS */
  private buildFullEtatBuckets(rows: { etat: string | null; c: any }[]): { etat: Etat; compte: number }[] {
    const map = new Map<string, number>();
    for (const r of rows || []) {
      const key = (r.etat || '').toString().trim().toUpperCase();
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + Number(r.c ?? 0));
    }
    return ALLOWED_ETATS.map(e => ({ etat: e, compte: map.get(e) ?? 0 }));
  }

  /* ========================= 1) Stats par TYPE (attribus only) ========================= */
  async typeStatsByGeo(q: TypeStatsGeoInput, req?: any) {
    const meta = await this.getTypeMeta(Number(q.typeId));
    if (!meta) throw new NotFoundException({ message: 'TypeInfrastructure invalide.', messageE: 'Invalid TypeInfrastructure.' });

    const userArrId = await this.getArrondissementFromUser(req);
    const W = this.whereSQL(q, userArrId);
    const ETAT = this.etatExprSQL();

    // Totaux & par nature
    const totalRows: any[] = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) AS c FROM Infrastructure ${W};`);
    const total = Number(totalRows?.[0]?.c ?? 0);

    const natureRows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT type, COUNT(*) AS c
      FROM Infrastructure
      ${W}
      GROUP BY type;
    `);
    const parNature = { SIMPLE: 0, COMPLEXE: 0 };
    for (const r of natureRows || []) {
      const t = (r.type ?? '').toString().toUpperCase();
      const c = Number(r.c ?? 0);
      if (t === 'SIMPLE') parNature.SIMPLE = c;
      else if (t === 'COMPLEXE') parNature.COMPLEXE = c;
    }

    // Répartition par ETAT (attribus): clé 'etat' OU 'ETAT', string OU array -> MAJ
    const byEtatRows = await this.prisma.$queryRawUnsafe<EtatRow[]>(`
      SELECT ${ETAT} AS etat, COUNT(*) AS c
      FROM Infrastructure
      ${W}
      GROUP BY etat
      ORDER BY c DESC;
    `);
    const repartition_etat = this.buildFullEtatBuckets(byEtatRows);

    // Recensement des clés d’attribut (hors 'etat'/'ETAT') via Prisma
    const rowsAttribus = await this.prisma.infrastructure.findMany({
      where: this.prismaWhere(q, userArrId),
      select: { attribus: true },
    });
    const keysSet = new Set<string>();
    for (const r of rowsAttribus) {
      const obj = r?.attribus as any;
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const k of Object.keys(obj)) {
          if (k && k.toLowerCase() !== 'etat') keysSet.add(k);
        }
      }
    }
    const attributes = Array.from(keysSet).sort();

    // Détails par attribut
    const attributs: any[] = [];
    for (const rawKey of attributes) {
      const key = this.escJsonKey(rawKey);

      const covSql = `
        SELECT
          COUNT(*) AS total,
          SUM(
            CASE
              WHEN JSON_EXTRACT(attribus, '$."${key}"') IS NULL
                   OR JSON_TYPE(JSON_EXTRACT(attribus, '$."${key}"'))='NULL'
                   OR (
                        JSON_TYPE(JSON_EXTRACT(attribus, '$."${key}"'))='STRING'
                        AND JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"'))=''
                      )
              THEN 0 ELSE 1
            END
          ) AS renseignes,
          SUM(JSON_TYPE(JSON_EXTRACT(attribus, '$."${key}"')) IN ('INTEGER','DOUBLE')) AS nb_num,
          SUM(JSON_TYPE(JSON_EXTRACT(attribus, '$."${key}"')) = 'BOOLEAN') AS nb_bool,
          SUM(JSON_TYPE(JSON_EXTRACT(attribus, '$."${key}"')) = 'STRING')  AS nb_str
        FROM Infrastructure
        ${W};
      `;
      const covRows: any[] = await this.prisma.$queryRawUnsafe(covSql);

      const totalK = Number(covRows?.[0]?.total ?? 0);
      const renseignes = Number(covRows?.[0]?.renseignes ?? 0);
      const nb_num = Number(covRows?.[0]?.nb_num ?? 0);
      const nb_bool = Number(covRows?.[0]?.nb_bool ?? 0);
      const nb_str = Number(covRows?.[0]?.nb_str ?? 0);

      let genre: 'nombre'|'booleen'|'enum'|'mixte' = 'mixte';
      if (nb_bool > 0 && nb_num === 0 && nb_str === 0) genre = 'booleen';
      else if (nb_num > 0 && nb_bool === 0 && nb_str === 0) genre = 'nombre';
      else if (nb_str > 0 && nb_bool === 0 && nb_num === 0) genre = 'enum';

      const bloc: any = {
        nom: rawKey,
        genre,
        couverture: {
          total: totalK,
          renseignes,
          pourcentage_renseignes: totalK ? +(renseignes * 100 / totalK).toFixed(2) : 0,
        },
      };

      if (genre === 'nombre') {
        const condNum = `JSON_TYPE(JSON_EXTRACT(attribus, '$."${key}"')) IN ('INTEGER','DOUBLE')`;
        const numRows: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT
            COUNT(*) AS n,
            SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) AS DECIMAL(30,6))) AS somme,
            AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) AS DECIMAL(30,6))) AS moyenne,
            MIN(CAST(JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) AS DECIMAL(30,6))) AS min_v,
            MAX(CAST(JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) AS DECIMAL(30,6))) AS max_v
          FROM Infrastructure
          ${this.andCond(W, condNum)};
        `);
        const byEtatNum: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT
            ${ETAT} AS etat,
            COUNT(*) AS n,
            SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) AS DECIMAL(30,6))) AS somme
          FROM Infrastructure
          ${this.andCond(W, condNum)}
          GROUP BY etat
          ORDER BY n DESC;
        `);
        const map = new Map<string, { n: number; somme: number }>();
        for (const r of byEtatNum || []) {
          const k = (r.etat || '').toString().toUpperCase();
          if (!k) continue;
          map.set(k, { n: Number(r.n ?? 0), somme: Number(r.somme ?? 0) });
        }
        bloc.numerique = {
          n: Number(numRows?.[0]?.n ?? 0),
          somme: Number(numRows?.[0]?.somme ?? 0),
          moyenne: Number(numRows?.[0]?.moyenne ?? 0),
          min: numRows?.[0]?.min_v !== null ? Number(numRows?.[0]?.min_v) : null,
          max: numRows?.[0]?.max_v !== null ? Number(numRows?.[0]?.max_v) : null,
        };
        bloc.par_etat = ALLOWED_ETATS.map(e => ({ etat: e, n: map.get(e)?.n ?? 0, somme: map.get(e)?.somme ?? 0 }));

      } else if (genre === 'booleen') {
        const condBool = `JSON_TYPE(JSON_EXTRACT(attribus, '$."${key}"')) = 'BOOLEAN'`;
        const boolRows: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT
            SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) = 'true'  THEN 1 ELSE 0 END) AS vrai,
            SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) = 'false' THEN 1 ELSE 0 END) AS faux
          FROM Infrastructure
          ${this.andCond(W, condBool)};
        `);
        const boolEtat: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT
            ${ETAT} AS etat,
            SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) = 'true'  THEN 1 ELSE 0 END) AS vrai,
            SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) = 'false' THEN 1 ELSE 0 END) AS faux
          FROM Infrastructure
          ${this.andCond(W, condBool)}
          GROUP BY etat
          ORDER BY (vrai+faux) DESC;
        `);
        const map = new Map<string, { vrai: number; faux: number }>();
        for (const r of boolEtat || []) {
          const k = (r.etat || '').toString().toUpperCase();
          if (!k) continue;
          map.set(k, { vrai: Number(r.vrai ?? 0), faux: Number(r.faux ?? 0) });
        }
        bloc.booleen = {
          vrai: Number(boolRows?.[0]?.vrai ?? 0),
          faux: Number(boolRows?.[0]?.faux ?? 0),
        };
        bloc.par_etat = ALLOWED_ETATS.map(e => ({ etat: e, vrai: map.get(e)?.vrai ?? 0, faux: map.get(e)?.faux ?? 0 }));

      } else {
        // enum / mixte -> distribution des valeurs (string non vide)
        const condStr = `
          JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) IS NOT NULL
          AND JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) <> ''
        `;
        const valRows: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) AS valeur, COUNT(*) AS c
          FROM Infrastructure
          ${this.andCond(W, condStr)}
          GROUP BY valeur
          ORDER BY c DESC;
        `);
        const valEtatRows: any[] = await this.prisma.$queryRawUnsafe(`
          SELECT
            ${ETAT} AS etat,
            JSON_UNQUOTE(JSON_EXTRACT(attribus, '$."${key}"')) AS valeur,
            COUNT(*) AS c
          FROM Infrastructure
          ${this.andCond(W, condStr)}
          GROUP BY etat, valeur
          ORDER BY valeur ASC, c DESC;
        `);
        bloc.valeurs = (valRows || []).map(v => {
          const map = new Map<string, number>();
          for (const e of valEtatRows || []) {
            if (e.valeur !== v.valeur) continue;
            const k = (e.etat || '').toString().toUpperCase();
            if (!k) continue;
            map.set(k, (map.get(k) ?? 0) + Number(e.c ?? 0));
          }
          return {
            valeur: v.valeur,
            compte: Number(v.c ?? 0),
            par_etat: ALLOWED_ETATS.map(e => ({ etat: e, compte: map.get(e) ?? 0 })),
          };
        });
      }

      attributs.push(bloc);
    }

    return {
      message: 'Statistiques du type (attribus uniquement).',
      params: {
        typeId: Number(q.typeId),
        regionId: q.regionId ?? null,
        departementId: q.departementId ?? null,
        arrondissementId: (q.arrondissementId ?? null) || (userArrId ?? null),
      },
      type: meta,
      resume: {
        total,
        repartition_etat,   // 👈 toujours 5 états, en MAJ
        par_nature: parNature,
      },
      attributs,
    };
  }

  /* ========================= 2) Stats par infraId (attribus only) ========================= */
  async typeStatsByGeoFromInfra(
    infraId: string | number,
    q: { regionId?: number; departementId?: number; arrondissementId?: number },
    req?: any,
  ) {
    const id = BigInt(String(infraId));
    const infra = await this.prisma.infrastructure.findUnique({
      where: { id },
      select: { id_type_infrastructure: true, regionId: true, departementId: true, arrondissementId: true },
    });
    if (!infra) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

    return this.typeStatsByGeo(
      {
        typeId: infra.id_type_infrastructure,
        regionId: q.regionId ?? infra.regionId ?? undefined,
        departementId: q.departementId ?? infra.departementId ?? undefined,
        arrondissementId: q.arrondissementId ?? infra.arrondissementId ?? undefined,
      },
      req,
    );
  }

  /* ========================= 3) Autres endpoints attendus par le contrôleur ========================= */

  /** Vérifie que les IDs territoriaux fournis existent (et la commune scoping si présente). */
  private async territoryIdsExist(q: Scope, req?: any): Promise<boolean> {
    const checks: Promise<number>[] = [];
    if (q.regionId)         checks.push(this.prisma.region.count({ where: { id: Number(q.regionId) } }));
    if (q.departementId)    checks.push(this.prisma.departement.count({ where: { id: Number(q.departementId) } }));
    if (q.arrondissementId) checks.push(this.prisma.arrondissement.count({ where: { id: Number(q.arrondissementId) } }));
    if (q.communeId)        checks.push(this.prisma.commune.count({ where: { id: Number(q.communeId) } }));
    const userCommuneId = req?.user?.communeId as number | undefined;
    if (userCommuneId)      checks.push(this.prisma.commune.count({ where: { id: Number(userCommuneId) } }));
    if (!checks.length) return true;
    const results = await Promise.all(checks);
    return results.every(c => c > 0);
  }

  /* ---- A. Overview ---- */
  async overview(q: Scope, req?: any) {
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message: 'Vue d’ensemble.', messageE: 'Overview.', data: { total_infrastructures: 0, communes_actives: 0, repartition: { SIMPLE: 0, COMPLEXE: 0 } } };
    }

    const [total, simple, complexe, communesActive] = await this.prisma.$transaction([
      this.prisma.infrastructure.count({ where }),
      this.prisma.infrastructure.count({ where: { ...where, type: 'SIMPLE' }}),
      this.prisma.infrastructure.count({ where: { ...where, type: 'COMPLEXE' }}),
      this.prisma.infrastructure.groupBy({ by: ['communeId'], where, orderBy: { communeId: 'asc' }, _count: { _all: true } }),
    ]);

    return {
      message: 'Vue d’ensemble.',
      messageE: 'Overview.',
      data: {
        total_infrastructures: total,
        communes_actives: communesActive.length,
        repartition: { SIMPLE: simple, COMPLEXE: complexe },
      },
    };
  }

  /* ---- B. Distribution par type ---- */
  async distributionTypes(q: Scope, req?: any) {
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message: 'Répartition par type.', messageE: 'Distribution by type.', items: [] };
    }

    const grouped = await this.prisma.infrastructure.groupBy({
      by: ['id_type_infrastructure'],
      where,
      orderBy: { id_type_infrastructure: 'asc' },
      _count: { _all: true },
    });

    if (!grouped.length) {
      return { message: 'Répartition par type.', messageE: 'Distribution by type.', items: [] };
    }

    const typeIds = grouped.map(g => g.id_type_infrastructure);
    const types = await this.prisma.typeInfrastructure.findMany({
      where: { id: { in: typeIds } }, select: { id:true, name:true, type:true },
    });
    const map = new Map(types.map(t=>[t.id, t]));
    const items = grouped.map((g:any) => ({
      typeId: g.id_type_infrastructure,
      name: map.get(g.id_type_infrastructure)?.name,
      count: g._count?._all ?? 0,
    }));
    return { message: 'Répartition par type.', messageE: 'Distribution by type.', items };
  }

  /* ---- C. Distribution par domaine ---- */
  async distributionDomaines(q: Scope, req?: any) {
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message: 'Répartition par domaine.', messageE: 'Distribution by domain.', items: [] };
    }

    const grouped = await this.prisma.infrastructure.groupBy({
      by: ['domaineId'],
      where,
      orderBy: { domaineId: 'asc' },
      _count: { _all: true },
    });

    if (!grouped.length) return { message: 'Répartition par domaine.', messageE: 'Distribution by domain.', items: [] };

    const ids = grouped.map(g => g.domaineId!).filter(Boolean);
    const doms = await this.prisma.domaine.findMany({ where: { id: { in: ids } }, select: { id:true, nom:true } });
    const map = new Map(doms.map(d=>[d.id, d.nom]));
    const items = grouped.map((g:any) => ({ domaineId: g.domaineId, name: map.get(g.domaineId!), count: g._count?._all ?? 0 }));
    return { message: 'Répartition par domaine.', messageE: 'Distribution by domain.', items };
  }

  /* ---- D. Séries temporelles (créations) ---- */
  private fmt(group_by:'mois'|'trimestre'|'annee'){ return group_by==='annee' ? '%Y' : group_by==='trimestre' ? null : '%Y-%m'; }

  async timeseriesCreated(q: Scope, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Série temporelle (créations).', messageE:'Time series (created).', items: [] };
    }

    const from = q.from ? new Date(q.from+'T00:00:00Z') : undefined;
    const to   = q.to   ? new Date(q.to  +'T23:59:59Z') : undefined;

    const fmt = this.fmt(q.group_by ?? 'mois');
    const baseWhere = sqlWhere(where);
    const dateCond  = from || to
      ? (baseWhere ? baseWhere+' AND ' : 'WHERE ') +
        [
          from ? `created_at >= '${from.toISOString().slice(0,19).replace('T',' ')}'` : '',
          to   ? `created_at <= '${to  .toISOString().slice(0,19).replace('T',' ')}'` : '',
        ].filter(Boolean).join(' AND ')
      : baseWhere;

    if (fmt) {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT DATE_FORMAT(created_at, '${fmt}') AS bucket, COUNT(*) AS c
        FROM Infrastructure
        ${dateCond || ''}
        GROUP BY bucket ORDER BY bucket ASC;
      `);
      return { message:'Série temporelle (créations).', messageE:'Time series (created).', items: rows };
    } else {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT CONCAT(YEAR(created_at),'-T',QUARTER(created_at)) AS bucket, COUNT(*) AS c
        FROM Infrastructure
        ${dateCond || ''}
        GROUP BY bucket ORDER BY bucket ASC;
      `);
      return { message:'Série temporelle (créations).', messageE:'Time series (created).', items: rows };
    }
  }

  /* ---- E. Séries temporelles (mises à jour) ---- */
  async timeseriesUpdates(q: Scope, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Série temporelle (mises à jour).', messageE:'Time series (updates).', items: [] };
    }

    const from = q.from ? new Date(q.from+'T00:00:00Z') : undefined;
    const to   = q.to   ? new Date(q.to  +'T23:59:59Z') : undefined;

    const fmt = this.fmt(q.group_by ?? 'mois');
    const baseWhere = sqlWhere(where);
    const dateCond  = from || to
      ? (baseWhere ? baseWhere+' AND ' : 'WHERE ') +
        [
          from ? `updated_at >= '${from.toISOString().slice(0,19).replace('T',' ')}'` : '',
          to   ? `updated_at <= '${to  .toISOString().slice(0,19).replace('T',' ')}'` : '',
        ].filter(Boolean).join(' AND ')
      : baseWhere;

    if (fmt) {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT DATE_FORMAT(updated_at, '${fmt}') AS bucket, COUNT(*) AS c
        FROM Infrastructure
        ${dateCond || ''}
        GROUP BY bucket ORDER BY bucket ASC;
      `);
      return { message:'Série temporelle (mises à jour).', messageE:'Time series (updates).', items: rows };
    } else {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT CONCAT(YEAR(updated_at),'-T',QUARTER(updated_at)) AS bucket, COUNT(*) AS c
        FROM Infrastructure
        ${dateCond || ''}
        GROUP BY bucket ORDER BY bucket ASC;
      `);
      return { message:'Série temporelle (mises à jour).', messageE:'Time series (updates).', items: rows };
    }
  }

  /* ---- F. Top communes ---- */
  async topCommunes(q: Scope, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Top communes.', messageE:'Top communes.', items: [] };
    }

    const rows = await this.prisma.infrastructure.groupBy({
      by: ['communeId'],
      where,
      orderBy: { communeId: 'asc' },
      _count: { _all: true },
    });
    if (!rows.length) return { message:'Top communes.', messageE:'Top communes.', items: [] };

    const sorted = (rows as any[])
      .sort((a,b) => (b._count._all ?? 0) - (a._count._all ?? 0))
      .slice(0, q.limit ?? 10);

    const communes = await this.prisma.commune.findMany({
      where: { id: { in: sorted.map(r=>r.communeId) }},
      select: { id:true, nom:true }
    });
    const map = new Map(communes.map(c=>[c.id, c.nom]));
    const items = sorted.map((r:any) => ({ communeId: r.communeId, commune: map.get(r.communeId), count: r._count._all ?? 0 }));
    return { message:'Top communes.', messageE:'Top communes.', items };
  }

  /* ---- G. Top types ---- */
  async topTypes(q: Scope, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Top types.', messageE:'Top types.', items: [] };
    }

    const rows = await this.prisma.infrastructure.groupBy({
      by: ['id_type_infrastructure'],
      where,
      orderBy: { id_type_infrastructure: 'asc' },
      _count: { _all: true },
    });
    if (!rows.length) return { message:'Top types.', messageE:'Top types.', items: [] };

    const sorted = (rows as any[])
      .sort((a,b) => (b._count._all ?? 0) - (a._count._all ?? 0))
      .slice(0, q.limit ?? 10);

    const types = await this.prisma.typeInfrastructure.findMany({
      where: { id: { in: sorted.map(r=>r.id_type_infrastructure) }},
      select: { id:true, name:true }
    });
    const map = new Map(types.map(t=>[t.id,t.name]));
    const items = sorted.map((r:any) => ({ typeId: r.id_type_infrastructure, name: map.get(r.id_type_infrastructure), count: r._count?._all ?? 0 }));
    return { message:'Top types.', messageE:'Top types.', items };
  }

  /* ---- H. Choropleth ---- */
  async mapChoropleth(q: Scope, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Choropleth prêt.', messageE:'Choropleth ready.', items: [] };
    }
    const rows = await this.prisma.infrastructure.groupBy({
      by: ['communeId'], where, orderBy: { communeId: 'asc' }, _count: { _all: true }
    });
    const items = (rows as any[]).map(r => ({ communeId: r.communeId, count: r._count._all ?? 0 }));
    return { message:'Choropleth prêt.', messageE:'Choropleth ready.', items };
  }

  /* ---- I. Heatmap points ---- */
  async mapHeatmap(q: Scope, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Heatmap prête.', messageE:'Heatmap ready.', items: [] };
    }
    if (q.from || q.to) {
      (where as any).created_at = {
        ...(q.from? { gte: new Date(q.from+'T00:00:00Z') }:{}),
        ...(q.to?   { lte: new Date(q.to  +'T23:59:59Z') }:{}),
      };
    }
    const rows = await this.prisma.infrastructure.findMany({ where, select: { id:true, location:true }});
    const points = rows
      .map(r => ({ id: toStrId(r.id), lat: (r.location as any)?.lat, lon: (r.location as any)?.log }))
      .filter(p => typeof p.lat === 'number' && typeof p.lon === 'number');
    return { message:'Heatmap prête.', messageE:'Heatmap ready.', items: points };
  }

  /* ---- J. Complétude d’un attribut (attribus only) ---- */
  async completeness(q: Scope & { attr: string }, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Complétude calculée.', messageE:'Completeness computed.', data: { total: 0, filled: 0, percent: 0 } };
    }

    const total = await this.prisma.infrastructure.count({ where });
    if (!total) return { message:'Complétude calculée.', messageE:'Completeness computed.', data: { total: 0, filled: 0, percent: 0 } };

    const key = q.attr.replace(/"/g,'\\"');
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS c
      FROM Infrastructure i
      ${sqlWhere(where)}
      ${sqlWhere(where) ? ' AND ' : 'WHERE '}
      JSON_EXTRACT(i.attribus, '$."${key}"') IS NOT NULL
      AND JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$."${key}"')) <> ''
    `);
    const filled = Number(rows?.[0]?.c ?? 0);
    const percent = total ? +(filled*100/total).toFixed(2) : 0;
    return { message:'Complétude calculée.', messageE:'Completeness computed.', data: { total, filled, percent } };
  }

  /* ---- K. Coverage ---- */
  async coverage(q: Scope, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Couverture calculée.', messageE:'Coverage computed.', data: { communes_total: 0, communes_couvertes: 0, percent: 0 } };
    }

    const active = await this.prisma.infrastructure.groupBy({ by: ['communeId'], where, orderBy: { communeId: 'asc' }, _count: { _all: true } });

    const communeScope: any = {};
    if (q.regionId)         communeScope.regionId = Number(q.regionId);
    if (q.departementId)    communeScope.departementId = Number(q.departementId);
    if (q.arrondissementId) communeScope.arrondissementId = Number(q.arrondissementId);

    const totalCommunes = await this.prisma.commune.count({ where: communeScope });
    const percent = totalCommunes ? +(active.length*100/totalCommunes).toFixed(2) : 0;
    return { message:'Couverture calculée.', messageE:'Coverage computed.', data: { communes_total: totalCommunes, communes_couvertes: active.length, percent } };
  }

  /* ---- L. Distribution d’un attribut (attribus only) ---- */
  async attrDistribution(q: Scope & { attr: string }, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Distribution attribut.', messageE:'Attribute distribution.', items: [] };
    }
    const key = q.attr.replace(/"/g,'\\"');
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$."${key}"')) AS value, COUNT(*) AS c
      FROM Infrastructure i
      ${sqlWhere(where)}
      GROUP BY value
      ORDER BY c DESC;
    `);
    return { message:'Distribution attribut.', messageE:'Attribute distribution.', items: rows.map(r=>({ value: r.value, count: Number(r.c) })) };
  }

  /* ---- M. Crosstab de 2 attributs (attribus only) ---- */
  async attrCrosstab(q: Scope & { attrA: string; attrB: string }, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Crosstab attributs.', messageE:'Attributes crosstab.', items: [] };
    }
    const A = q.attrA.replace(/"/g,'\\"');
    const B = q.attrB.replace(/"/g,'\\"');
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$."${A}"')) AS a,
        JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$."${B}"')) AS b,
        COUNT(*) AS c
      FROM Infrastructure i
      ${sqlWhere(where)}
      GROUP BY a,b
      ORDER BY c DESC;
    `);
    return { message:'Crosstab attributs.', messageE:'Attributes crosstab.', items: rows.map(r=>({ a: r.a, b: r.b, count: Number(r.c) })) };
  }

  /* ---- N. Fraîcheur ---- */
  async freshness(q: Scope & { max_age_days?: number }, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Fraîcheur calculée.', messageE:'Freshness computed.', data: { total: 0, recent: 0, percent_recent: 0 } };
    }
    const days = Number(q.max_age_days ?? 90);
    const recent = await this.prisma.infrastructure.count({
      where: { ...where, updated_at: { gte: new Date(Date.now() - days*86400000) } },
    });
    const total = await this.prisma.infrastructure.count({ where });
    const percent = total ? +(recent*100/total).toFixed(2) : 0;
    return { message:'Fraîcheur calculée.', messageE:'Freshness computed.', data: { total, recent, percent_recent: percent } };
  }

  /* ---- O. Activité ---- */
  async activity(q: Scope & { from?: string; to?: string }, req?: any){
    const where = buildWhere(q, req);
    if (!(await this.territoryIdsExist(q, req))) {
      return { message:'Activité agrégée.', messageE:'Aggregated activity.', items: [] };
    }

    const from = q.from ? new Date(q.from+'T00:00:00Z') : new Date(Date.now()-30*86400000);
    const to   = q.to   ? new Date(q.to  +'T23:59:59Z') : new Date();

    const base = sqlWhere(where);
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT DATE(created_at) AS d, COUNT(*) AS created,
             (SELECT COUNT(*) FROM Infrastructure j WHERE DATE(j.updated_at)=DATE(i.created_at)
                ${base ? ' AND '+base.replace(/^WHERE /,'') : ''}) AS updated
      FROM Infrastructure i
      WHERE DATE(i.created_at) BETWEEN DATE('${from.toISOString().slice(0,10)}') AND DATE('${to.toISOString().slice(0,10)}')
        ${base ? ' AND '+base.replace(/^WHERE /,'') : ''}
      GROUP BY d ORDER BY d ASC;
    `);
    return { message:'Activité agrégée.', messageE:'Aggregated activity.', items: rows.map(r=>({ date: r.d, created: Number(r.created), updated: Number(r.updated) })) };
  }
}
