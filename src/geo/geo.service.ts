import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function rad(v: number) { return (v * Math.PI) / 180; }
function haversine(lat1:number, lon1:number, lat2:number, lon2:number) {
  const R = 6371000;
  const dLat = rad(lat2-lat1);
  const dLon = rad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
function toStrId(id: bigint | number | string) { return typeof id === 'bigint' ? id.toString() : String(id); }
function tile2bbox(z:number,x:number,y:number){
  const n = Math.pow(2,z);
  const lon1 = x/n*360 - 180;
  const lon2 = (x+1)/n*360 - 180;
  const lat1 = (Math.atan(Math.sinh(Math.PI*(1-2*(y+1)/n)))*180/Math.PI);
  const lat2 = (Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI);
  return { minLon: lon1, minLat: lat1, maxLon: lon2, maxLat: lat2 };
}
function pointInPolygon(lon:number, lat:number, poly:number[][]){
  // ray casting
  let inside = false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const xi=poly[i][0], yi=poly[i][1];
    const xj=poly[j][0], yj=poly[j][1];
    const intersect = ((yi>lat)!==(yj>lat)) && (lon < (xj-xi)*(lat-yi)/(yj-yi)+xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

@Injectable()
export class GeoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Nearby avec filtre JSON_EXTRACT + Haversine */
  async nearby(params: { lat:number; lon:number; radius:number; typeId?:number; domaineId?:number; page:number; pageSize:number }) {
    const { lat, lon, radius, typeId, domaineId, page, pageSize } = params;
    // filtre bbox rapide (≈ rayon -> delta deg)
    const dLat = radius / 111320; // ~m per deg lat
    const dLon = radius / (111320 * Math.cos(rad(lat)));

    const typeCond = typeId ? `AND i.id_type_infrastructure = ${typeId}` : '';
    const domCond  = domaineId ? `AND i.domaineId = ${domaineId}` : '';

    const sql = `
      SELECT
        i.id, i.name, i.id_type_infrastructure, i.type, i.regionId, i.departementId, i.arrondissementId, i.communeId,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.lat')) AS DECIMAL(10,6)) AS lat,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.log')) AS DECIMAL(10,6)) AS lon
      FROM Infrastructure i
      WHERE JSON_EXTRACT(i.location, '$.lat') IS NOT NULL
        AND JSON_EXTRACT(i.location, '$.log') IS NOT NULL
        AND CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.lat')) AS DECIMAL(10,6)) BETWEEN ${lat-dLat} AND ${lat+dLat}
        AND CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.log')) AS DECIMAL(10,6)) BETWEEN ${lon-dLon} AND ${lon+dLon}
        ${typeCond} ${domCond}
      ORDER BY i.created_at DESC
      LIMIT ${(page-1)*pageSize}, ${pageSize};
    `;

    const rough: any[] = await this.prisma.$queryRawUnsafe(sql);
    const withDist = rough.map(r => ({ ...r, id: toStrId(r.id), distance: haversine(lat, lon, Number(r.lat), Number(r.lon)) }))
                          .filter(r => r.distance <= radius)
                          .sort((a,b)=>a.distance-b.distance);

    return { message: 'Résultats proximité.', messageE: 'Nearby results.', items: withDist };
  }

  /** Within polygon (GeoJSON) */
  async within(params: { polygon:any; typeId?:number; domaineId?:number; page:number; pageSize:number }) {
    const { polygon, typeId, domaineId, page, pageSize } = params;
    if (!polygon?.type || polygon.type !== 'Polygon') {
      throw new BadRequestException({ message: 'GeoJSON Polygon invalide.', messageE: 'Invalid GeoJSON Polygon.' });
    }
    const ring: number[][] = polygon.coordinates?.[0] ?? [];
    if (ring.length < 4) throw new BadRequestException({ message: 'Polygone insuffisant.', messageE: 'Polygon too small.' });

    const lons = ring.map(p=>p[0]); const lats = ring.map(p=>p[1]);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);

    const typeCond = typeId ? `AND i.id_type_infrastructure = ${typeId}` : '';
    const domCond  = domaineId ? `AND i.domaineId = ${domaineId}` : '';

    const sql = `
      SELECT
        i.id, i.name, i.id_type_infrastructure, i.type,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.lat')) AS DECIMAL(10,6)) AS lat,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.log')) AS DECIMAL(10,6)) AS lon
      FROM Infrastructure i
      WHERE JSON_EXTRACT(i.location, '$.lat') IS NOT NULL
        AND JSON_EXTRACT(i.location, '$.log') IS NOT NULL
        AND CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.lat')) AS DECIMAL(10,6)) BETWEEN ${minLat} AND ${maxLat}
        AND CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.log')) AS DECIMAL(10,6)) BETWEEN ${minLon} AND ${maxLon}
        ${typeCond} ${domCond}
      LIMIT ${(page-1)*pageSize}, ${pageSize};
    `;
    const rough: any[] = await this.prisma.$queryRawUnsafe(sql);
    const items = rough.filter(r => pointInPolygon(Number(r.lon), Number(r.lat), ring)).map(r => ({ ...r, id: toStrId(r.id) }));
    return { message: 'Sélection par polygone.', messageE: 'Polygon selection.', items };
  }

  /** Distance entre deux infrastructures (m et km) */
  async distance(fromId: string, toId: string) {
    const [a, b] = await this.prisma.$transaction([
      this.prisma.infrastructure.findUnique({ where: { id: BigInt(fromId) }, select: { id:true, name:true, location:true } }),
      this.prisma.infrastructure.findUnique({ where: { id: BigInt(toId)   }, select: { id:true, name:true, location:true } }),
    ]);
    if (!a || !b) throw new NotFoundException({ message: 'Infra introuvable.', messageE: 'Infrastructure not found.' });

    const la = Number((a.location as any)?.lat), loa = Number((a.location as any)?.log);
    const lb = Number((b.location as any)?.lat), lob = Number((b.location as any)?.log);
    if (Number.isNaN(la) || Number.isNaN(loa) || Number.isNaN(lb) || Number.isNaN(lob)) {
      throw new BadRequestException({ message: 'Coordonnées manquantes.', messageE: 'Missing coordinates.' });
    }
    const m = haversine(la, loa, lb, lob);
    return { message: 'Distance calculée.', messageE: 'Distance computed.', data: { fromId, toId, meters: Math.round(m), km: +(m/1000).toFixed(3) } };
  }

  /** Heatmap tile simple: agrégation par grille ~100m via arrondi */
  async heatmapTile(z:number,x:number,y:number, typeId?:number) {
    const { minLat, maxLat, minLon, maxLon } = tile2bbox(z,x,y);
    const typeCond = typeId ? `AND i.id_type_infrastructure = ${typeId}` : '';
    const sql = `
      SELECT
        CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.lat')) AS DECIMAL(10,6)) AS lat,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.log')) AS DECIMAL(10,6)) AS lon
      FROM Infrastructure i
      WHERE JSON_EXTRACT(i.location, '$.lat') IS NOT NULL
        AND JSON_EXTRACT(i.location, '$.log') IS NOT NULL
        AND CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.lat')) AS DECIMAL(10,6)) BETWEEN ${minLat} AND ${maxLat}
        AND CAST(JSON_UNQUOTE(JSON_EXTRACT(i.location, '$.log')) AS DECIMAL(10,6)) BETWEEN ${minLon} AND ${maxLon}
        ${typeCond};
    `;
    const rows: any[] = await this.prisma.$queryRawUnsafe(sql);
    // agrégation ~100m (3 décimales)
    const key = (lat:number,lon:number)=>`${lat.toFixed(3)},${lon.toFixed(3)}`;
    const bucket = new Map<string, number>();
    for (const r of rows) {
      const k = key(Number(r.lat), Number(r.lon));
      bucket.set(k, (bucket.get(k) ?? 0) + 1);
    }
    const points = Array.from(bucket.entries()).map(([k,c])=>{
      const [latStr, lonStr] = k.split(',');
      return { lat: Number(latStr), lon: Number(lonStr), count: c };
    });
    return { message: 'Tuiles heatmap.', messageE: 'Heatmap tiles.', data: { z,x,y, points } };
  }
}
