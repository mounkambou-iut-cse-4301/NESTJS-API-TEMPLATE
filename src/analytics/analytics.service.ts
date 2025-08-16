import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function scopeWhere(s: any) {
  const where: any = {};
  if (s.level === 'region' && s.regionId) where.regionId = s.regionId;
  if (s.level === 'departement' && s.departementId) where.departementId = s.departementId;
  if (s.level === 'arrondissement' && s.arrondissementId) where.arrondissementId = s.arrondissementId;
  if (s.level === 'commune' && s.communeId) where.communeId = s.communeId;
  return where;
}
function toStrId(id:any){ return typeof id === 'bigint' ? id.toString() : String(id); }

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /* A. Overview */
  async overview(q: any) {
    const where = scopeWhere(q);
    const [total, simple, complexe, communesActive] = await this.prisma.$transaction([
      this.prisma.infrastructure.count({ where }),
      this.prisma.infrastructure.count({ where: { ...where, type: 'SIMPLE' }}),
      this.prisma.infrastructure.count({ where: { ...where, type: 'COMPLEXE' }}),
      // ✅ Ajout orderBy minimal
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

  /* B. Distribution par type */
  async distributionTypes(q: any) {
    const where = scopeWhere(q);
    const grouped = await this.prisma.infrastructure.groupBy({
      by: ['id_type_infrastructure'],
      where,
      orderBy: { id_type_infrastructure: 'asc' }, // ✅
      _count: { _all: true },
    });
    const typeIds = grouped.map(g => g.id_type_infrastructure);
    const types = await this.prisma.typeInfrastructure.findMany({
      where: { id: { in: typeIds } }, select: { id:true, name:true, type:true },
    });
    const map = new Map(types.map(t=>[t.id, t]));
    const items = grouped
      .map((g:any) => ({ typeId: g.id_type_infrastructure, name: map.get(g.id_type_infrastructure)?.name, count: g._count?._all ?? 0 }));
    return { message: 'Répartition par type.', messageE: 'Distribution by type.', items };
  }

  /* B. Distribution par domaine */
  async distributionDomaines(q: any) {
    const where = scopeWhere(q);
    const grouped = await this.prisma.infrastructure.groupBy({
      by: ['domaineId'],
      where,
      orderBy: { domaineId: 'asc' }, // ✅
      _count: { _all: true },
    });
    const ids = grouped.map(g => g.domaineId!).filter(Boolean);
    const doms = await this.prisma.domaine.findMany({ where: { id: { in: ids } }, select: { id:true, nom:true } });
    const map = new Map(doms.map(d=>[d.id, d.nom]));
    const items = grouped.map((g:any) => ({ domaineId: g.domaineId, name: map.get(g.domaineId!), count: g._count?._all ?? 0 }));
    return { message: 'Répartition par domaine.', messageE: 'Distribution by domain.', items };
  }

  /* C. Timeseries - inchangé (SQL brut) */
  private fmt(group_by:'mois'|'trimestre'|'annee'){ return group_by==='annee' ? '%Y' : group_by==='trimestre' ? 'CONCAT(YEAR(created_at),"-T",QUARTER(created_at))' : '%Y-%m'; }
  async timeseriesCreated(q:any){
    const where = scopeWhere(q);
    const from = q.from ? new Date(q.from+'T00:00:00Z') : undefined;
    const to   = q.to   ? new Date(q.to  +'T23:59:59Z') : undefined;
    if (from || to) (where as any).created_at = { ...(from?{ gte: from }:{}), ...(to?{ lte: to }:{}) };
    const fmt = q.group_by==='annee' ? '%Y' : q.group_by==='trimestre' ? null : '%Y-%m';
    if (fmt) {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT DATE_FORMAT(created_at, '${fmt}') AS bucket, COUNT(*) AS c
        FROM Infrastructure
        ${Object.keys(where).length? 'WHERE '+Object.entries(where).map(([k,v])=>`${k}=${Number(v)}`).join(' AND '):''}
        GROUP BY bucket ORDER BY bucket ASC;
      `);
      return { message:'Série temporelle (créations).', messageE:'Time series (created).', items: rows };
    } else {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT CONCAT(YEAR(created_at),'-T',QUARTER(created_at)) AS bucket, COUNT(*) AS c
        FROM Infrastructure
        ${Object.keys(where).length? 'WHERE '+Object.entries(where).map(([k,v])=>`${k}=${Number(v)}`).join(' AND '):''}
        GROUP BY bucket ORDER BY bucket ASC;
      `);
      return { message:'Série temporelle (créations).', messageE:'Time series (created).', items: rows };
    }
  }
  async timeseriesUpdates(q:any){
    const where = scopeWhere(q);
    const from = q.from ? new Date(q.from+'T00:00:00Z') : undefined;
    const to   = q.to   ? new Date(q.to  +'T23:59:59Z') : undefined;
    if (from || to) (where as any).updated_at = { ...(from?{ gte: from }:{}), ...(to?{ lte: to }:{}) };
    const fmt = q.group_by==='annee' ? '%Y' : q.group_by==='trimestre' ? null : '%Y-%m';
    if (fmt) {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT DATE_FORMAT(updated_at, '${fmt}') AS bucket, COUNT(*) AS c
        FROM Infrastructure
        ${Object.keys(where).length? 'WHERE '+Object.entries(where).map(([k,v])=>`${k}=${Number(v)}`).join(' AND '):''}
        GROUP BY bucket ORDER BY bucket ASC;
      `);
      return { message:'Série temporelle (mises à jour).', messageE:'Time series (updates).', items: rows };
    } else {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT CONCAT(YEAR(updated_at),'-T',QUARTER(updated_at)) AS bucket, COUNT(*) AS c
        FROM Infrastructure
        ${Object.keys(where).length? 'WHERE '+Object.entries(where).map(([k,v])=>`${k}=${Number(v)}`).join(' AND '):''}
        GROUP BY bucket ORDER BY bucket ASC;
      `);
      return { message:'Série temporelle (mises à jour).', messageE:'Time series (updates).', items: rows };
    }
  }

  /* D. Top - tri côté Node (évite orderBy sur _count._all) */
  async topCommunes(q:any){
    const where = scopeWhere(q);
    const rows = await this.prisma.infrastructure.groupBy({
      by: ['communeId'],
      where,
      orderBy: { communeId: 'asc' }, // ✅
      _count: { _all: true },
    });
    const sorted = (rows as any[]).sort((a,b) => (b._count._all ?? 0) - (a._count._all ?? 0)).slice(0, q.limit ?? 10);
    const communes = await this.prisma.commune.findMany({ where: { id: { in: sorted.map(r=>r.communeId) }}, select: { id:true, nom:true }});
    const map = new Map(communes.map(c=>[c.id, c.nom]));
    const items = sorted.map((r:any) => ({ communeId: r.communeId, commune: map.get(r.communeId), count: r._count._all ?? 0 }));
    return { message:'Top communes.', messageE:'Top communes.', items };
  }

  async topTypes(q:any){
    const where = scopeWhere(q);
    const rows = await this.prisma.infrastructure.groupBy({
      by: ['id_type_infrastructure'],
      where,
      orderBy: { id_type_infrastructure: 'asc' }, // ✅
      _count: { _all: true },
    });
    const sorted = (rows as any[]).sort((a,b) => (b._count._all ?? 0) - (a._count._all ?? 0)).slice(0, q.limit ?? 10);
    const types = await this.prisma.typeInfrastructure.findMany({ where: { id: { in: sorted.map(r=>r.id_type_infrastructure) }}, select: { id:true, name:true }});
    const map = new Map(types.map(t=>[t.id,t.name]));
    const items = sorted.map((r:any) => ({ typeId: r.id_type_infrastructure, name: map.get(r.id_type_infrastructure), count: r._count._all ?? 0 }));
    return { message:'Top types.', messageE:'Top types.', items };
  }

  /* E. Choropleth */
  async mapChoropleth(q:any){
    const where = scopeWhere(q);
    const rows = await this.prisma.infrastructure.groupBy({ by: ['communeId'], where, orderBy: { communeId: 'asc' }, _count: { _all: true } });
    const items = (rows as any[]).map(r => ({ communeId: r.communeId, count: r._count._all ?? 0 }));
    return { message:'Choropleth prêt.', messageE:'Choropleth ready.', items };
  }

  /* F, G, H — inchangés (voir ta version précédente) */
  async mapHeatmap(q:any){
    const where = scopeWhere(q);
    if (q.typeId) (where as any).id_type_infrastructure = q.typeId;
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

  async completeness(q:any){
    const where = scopeWhere(q);
    if (q.typeId) (where as any).id_type_infrastructure = q.typeId;
    const total = await this.prisma.infrastructure.count({ where });
    const key = q.attr.replace(/"/g,'\\"');
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS c
      FROM Infrastructure i
      WHERE ${Object.keys(where).length? Object.entries(where).map(([k,v])=>`${k}=${Number(v)}`).join(' AND ')+' AND ':''}
            JSON_EXTRACT(i.attribus, '$."${key}"') IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$."${key}"')) <> ''
    `);
    const filled = Number(rows?.[0]?.c ?? 0);
    const percent = total ? +(filled*100/total).toFixed(2) : 0;
    return { message:'Complétude calculée.', messageE:'Completeness computed.', data: { total, filled, percent } };
  }

  async coverage(q:any){
    const where = scopeWhere(q);
    if (q.typeId) (where as any).id_type_infrastructure = q.typeId;
    const active = await this.prisma.infrastructure.groupBy({ by: ['communeId'], where, orderBy: { communeId: 'asc' }, _count: { _all: true }});
    const whereCommune: any = {};
    if (q.level==='region' && q.regionId) whereCommune.regionId = q.regionId;
    if (q.level==='departement' && q.departementId) whereCommune.departementId = q.departementId;
    if (q.level==='arrondissement' && q.arrondissementId) whereCommune.arrondissementId = q.arrondissementId;
    const totalCommunes = await this.prisma.commune.count({ where: whereCommune });
    const percent = totalCommunes ? +(active.length*100/totalCommunes).toFixed(2) : 0;
    return { message:'Couverture calculée.', messageE:'Coverage computed.', data: { communes_total: totalCommunes, communes_couvertes: active.length, percent } };
  }

  async attrDistribution(q:any){
    const where = scopeWhere(q);
    if (q.typeId) (where as any).id_type_infrastructure = q.typeId;
    const key = q.attr.replace(/"/g,'\\"');
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$."${key}"')) AS value, COUNT(*) AS c
      FROM Infrastructure i
      ${Object.keys(where).length? 'WHERE '+Object.entries(where).map(([k,v])=>`${k}=${Number(v)}`).join(' AND '):''}
      GROUP BY value
      ORDER BY c DESC;
    `);
    return { message:'Distribution attribut.', messageE:'Attribute distribution.', items: rows.map(r=>({ value: r.value, count: Number(r.c) })) };
  }

  async attrCrosstab(q:any){
    const where = scopeWhere(q);
    if (q.typeId) (where as any).id_type_infrastructure = q.typeId;
    const A = q.attrA.replace(/"/g,'\\"');
    const B = q.attrB.replace(/"/g,'\\"');
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$."${A}"')) AS a,
        JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$."${B}"')) AS b,
        COUNT(*) AS c
      FROM Infrastructure i
      ${Object.keys(where).length? 'WHERE '+Object.entries(where).map(([k,v])=>`${k}=${Number(v)}`).join(' AND '):''}
      GROUP BY a,b
      ORDER BY c DESC;
    `);
    return { message:'Crosstab attributs.', messageE:'Attributes crosstab.', items: rows.map(r=>({ a: r.a, b: r.b, count: Number(r.c) })) };
  }

  async freshness(q:any){
    const where = scopeWhere(q);
    const rows = await this.prisma.infrastructure.count({
      where: { ...where, updated_at: { gte: new Date(Date.now() - (q.max_age_days ?? 90)*86400000) } },
    });
    const total = await this.prisma.infrastructure.count({ where });
    const percent = total ? +(rows*100/total).toFixed(2) : 0;
    return { message:'Fraîcheur calculée.', messageE:'Freshness computed.', data: { total, recent: rows, percent_recent: percent } };
  }

  async activity(q:any){
    const where = scopeWhere(q);
    const from = q.from ? new Date(q.from+'T00:00:00Z') : new Date(Date.now()-30*86400000);
    const to   = q.to   ? new Date(q.to  +'T23:59:59Z') : new Date();
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT DATE(created_at) AS d, COUNT(*) AS created,
             (SELECT COUNT(*) FROM Infrastructure j WHERE DATE(j.updated_at)=DATE(i.created_at)
                ${Object.keys(where).length? ' AND '+Object.entries(where).map(([k,v])=>`j.${k}=${Number(v)}`).join(' AND '):''}) AS updated
      FROM Infrastructure i
      WHERE DATE(i.created_at) BETWEEN DATE('${from.toISOString().slice(0,10)}') AND DATE('${to.toISOString().slice(0,10)}')
        ${Object.keys(where).length? ' AND '+Object.entries(where).map(([k,v])=>`i.${k}=${Number(v)}`).join(' AND '):''}
      GROUP BY d ORDER BY d ASC;
    `);
    return { message:'Activité agrégée.', messageE:'Aggregated activity.', items: rows.map(r=>({ date: r.d, created: Number(r.created), updated: Number(r.updated) })) };
  }
}
