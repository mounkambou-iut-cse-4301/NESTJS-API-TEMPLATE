import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';

/* ------------------------------- Helpers ------------------------------- */

function isPlainObject(v: any) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

/** MAJ + suppression des accents (pour clés & valeurs enum) */
function toUpperNoAccent(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/** Split sur , ; | et normalise (trim, filtre vides) */
function csvToArray(input: string): string[] {
  return input
    .split(/[,\|;]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

/** Normalise un tableau d’options enum (upper, no accent, unique) */
function normalizeEnumArray(arr: any[]): string[] {
  const out = arr
    .map(v => (v === null || v === undefined) ? '' : toUpperNoAccent(String(v)))
    .filter(Boolean);
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const v of out) { if (!seen.has(v)) { seen.add(v); uniq.push(v); } }
  return uniq;
}

/** Convertit (id | string | {id} | array) -> array d’IDs numériques uniques */
function toIdArray(input: any): number[] {
  const arr = Array.isArray(input) ? input : (input == null ? [] : [input]);
  const ids = arr
    .map((it) => {
      if (typeof it === 'number') return it;
      if (typeof it === 'string' && it.trim() !== '' && !Number.isNaN(Number(it))) return Number(it);
      if (it && typeof it === 'object' && typeof (it as any).id !== 'undefined') {
        const v = (it as any).id;
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
      }
      return null;
    })
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  return Array.from(new Set(ids));
}

/**
 * Attributs :
 *  - KEY toujours en MAJ SANS ACCENT
 *  - 'enm' => 'enum'
 *  - 'string' avec séparateurs => enum + value=array
 *  - enum + string => split CSV
 *  - enum + scalaire => array [val]
 */
function normalizeOneAttribut(attr: any): any {
  const base = isPlainObject(attr) ? attr : {};
  const out: any = { ...base };

  if (out.key !== undefined && out.key !== null) out.key = toUpperNoAccent(String(out.key));
  const rawType = typeof out.type === 'string' ? out.type.trim().toLowerCase() : out.type;

  let t: string | undefined = rawType;
  if (t === 'enm') t = 'enum';

  const valueIsDelimitedString =
    (t === 'string' || t === undefined) &&
    typeof out.value === 'string' &&
    /[,\|;]+/.test(out.value);

  if (valueIsDelimitedString) {
    t = 'enum';
    out.value = csvToArray(out.value);
  }

  if (t === 'enum') {
    if (out.value === null || out.value === undefined) {
      out.value = null;
    } else if (typeof out.value === 'string') {
      out.value = normalizeEnumArray(csvToArray(out.value));
    } else if (Array.isArray(out.value)) {
      out.value = normalizeEnumArray(out.value);
    } else {
      out.value = normalizeEnumArray([out.value]);
    }
    out.type = 'enum';
    return out;
  }

  if (t === 'string' && typeof out.value !== 'string' && out.value != null) {
    out.value = String(out.value);
  }

  out.type = t ?? out.type;
  return out;
}

function normalizeAttribus(input: any): any[] {
  const arr = Array.isArray(input) ? input : [];
  return arr.filter(it => it && typeof it === 'object').map(normalizeOneAttribut);
}

/** Injecte ETAT (enum) + LONGITUDE + LATITUDE si absents */
function ensureCoreAttributes(attribus: any[], location?: any): any[] {
  const list = Array.isArray(attribus) ? [...attribus] : [];

  const has = (k: string) => list.some(a => toUpperNoAccent(String(a?.key ?? '')) === k);

  if (!has('ETAT')) {
    list.push({
      key: 'ETAT',
      type: 'enum',
      value: ['EXCELLENT', 'BON', 'PASSABLE', 'MAUVAIS', 'TRES MAUVAIS'],
    });
  }
  return normalizeAttribus(list);
}

/**
 * Normalisation globale pour CREATE/UPDATE :
 * - type (SIMPLE|COMPLEXE)
 * - location objet, images array
 * - attribus normalisés (+ injection ETAT/LON/LAT)
 * - composant: stocké comme array d’IDs
 */
function normalizeTypePayload(input: Partial<CreateTypeDto | UpdateTypeDto>) {
  const out: any = { ...input };

  if (typeof out.type === 'string') {
    out.type = out.type.toUpperCase();
    if (out.type !== 'SIMPLE' && out.type !== 'COMPLEXE') {
      throw new BadRequestException({ message: 'Type invalide (SIMPLE ou COMPLEXE).', messageE: 'Invalid type (SIMPLE or COMPLEXE).' });
    }
  }

  if (out.location !== undefined) out.location = isPlainObject(out.location) ? out.location : {};
  if (out.images !== undefined)   out.images   = Array.isArray(out.images) ? out.images : [];

  if (out.attribus !== undefined) {
    out.attribus = ensureCoreAttributes(normalizeAttribus(out.attribus), out.location);
  }

  if (out.composant !== undefined) {
    out.composant = toIdArray(out.composant);
  }

  if (out.description !== undefined && out.description !== null && typeof out.description !== 'string') {
    out.description = String(out.description);
  }

  return out;
}

/* -------------------------------- Service ------------------------------- */

@Injectable()
export class TypesService {
  constructor(private readonly prisma: PrismaService) {}

  /* ===================== Expansion récursive — FULL OBJECTS ===================== */

  /** Sélecteur complet pour un type d’infrastructure (retour API) */
  private get fullSelect() {
    return {
      id: true,
      name: true,
      description: true,
      type: true,
      location: true,
      images: true,
      attribus: true,
      composant: true,               // <-- IDs en base
      domaineId: true,
      domaine: { select: { id: true, nom: true, code: true } },
      sousdomaineId: true,
      sousdomaine: { select: { id: true, nom: true, code: true } },
      competenceId: true,
      competence: true,
      created_at: true,
      updated_at: true,
    } as const;
  }

  /** Matérialise un enregistrement DB en objet API (sanitization simple) */
  private materialize(row: any) {
    return {
      ...row,
      attribus: Array.isArray(row.attribus) ? row.attribus : [],
      images: Array.isArray(row.images) ? row.images : [],
      location: isPlainObject(row.location) ? row.location : {},
      // composant sera remplacé ensuite par des objets
    };
  }

  /**
   * Expansion récursive des composants :
   * - lit les IDs de composant,
   * - charge les objets complets,
   * - remonte récursivement jusqu’à maxDepth,
   * - protège contre les cycles (visited),
   * - cache les fetchs (cache Map).
   */
  private async expandFullTreeByIds(
    ids: number[],
    maxDepth = 10,
    visited = new Set<number>(),
    cache = new Map<number, any>(),
  ): Promise<any[]> {
    const order = ids ?? [];
    if (!order.length || maxDepth <= 0) return [];

    // IDs manquants en cache
    const missing = order.filter((id) => !cache.has(id));
    if (missing.length) {
      const rows = await this.prisma.typeInfrastructure.findMany({
        where: { id: { in: missing } },
        select: this.fullSelect,
      });
      rows.forEach((r) => cache.set(r.id, this.materialize(r)));
    }

    // Construire chaque node, en respectant l’ordre initial
    const nodes: any[] = [];
    for (const id of order) {
      const base = cache.get(id);
      if (!base) continue;

      // anti-cycle
      if (visited.has(id)) {
        // si cycle, on renvoie le noeud sans ses enfants pour éviter boucle
        nodes.push({ ...base, composant: [] });
        continue;
      }

      visited.add(id);

      const childIds = toIdArray(base.composant);
      const children = await this.expandFullTreeByIds(childIds, maxDepth - 1, visited, cache);

      nodes.push({
        ...base,
        composant: children, // objets complets des enfants
      });

      visited.delete(id);
    }

    return nodes;
  }

  /* ===================== LIST ===================== */
  async list(params: {
    page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>;
    q?: string; type?: string; domaineId?: number; sousdomaineId?: number; competenceId?: number;
    depth?: number; // facultatif, par défaut 1 (enfants directs)
  }) {
    const { page, pageSize, sort, q, type, domaineId, sousdomaineId, competenceId } = params;
    const depth = Math.max(1, Math.min(Number(params.depth ?? 1), 5));

    const where: any = {};
    if (q) {
      where.OR = [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type;
    if (typeof domaineId === 'number') where.domaineId = domaineId;
    if (typeof sousdomaineId === 'number') where.sousdomaineId = sousdomaineId;
    if (typeof competenceId === 'number') where.competenceId = competenceId;

    const [total, itemsRaw] = await this.prisma.$transaction([
      this.prisma.typeInfrastructure.count({ where }),
      this.prisma.typeInfrastructure.findMany({
        where,
        orderBy: sort ?? { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: this.fullSelect,
      }),
    ]);

    const cache = new Map<number, any>();
    const items: any[] = [];
    for (const raw of itemsRaw) {
      const base = this.materialize(raw);
      const compIds = toIdArray(base.composant);
      const composant =
        depth > 1
          ? await this.expandFullTreeByIds(compIds, depth, new Set<number>(), cache)
          : await this.expandFullTreeByIds(compIds, 1, new Set<number>(), cache);
      items.push({ ...base, composant });
    }

    return { total, items };
  }

  /* ===================== CREATE ===================== */
  async create(dto: CreateTypeDto) {
    if (typeof dto.domaineId === 'number') {
      const exists = await this.prisma.domaine.count({ where: { id: dto.domaineId } });
      if (!exists) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });
    }
    if (typeof dto.sousdomaineId === 'number') {
      const exists = await this.prisma.sousDomaine.count({ where: { id: dto.sousdomaineId } });
      if (!exists) throw new BadRequestException({ message: 'Sous-domaine invalide.', messageE: 'Invalid subdomain.' });
    }

    const normalized = normalizeTypePayload({
      ...dto,
      location: dto.location ?? {},
      images: dto.images ?? [],
      attribus: dto.attribus ?? [],
      composant: dto.composant ?? [],
    });

    try {
      const created = await this.prisma.typeInfrastructure.create({
        data: {
          name: normalized.name,
          description: normalized.description ?? null,
          type: normalized.type,
          location: normalized.location,
          images: normalized.images,
          attribus: normalized.attribus,
          composant: normalized.composant, // IDs
          domaineId: dto.domaineId ?? null,
          sousdomaineId: dto.sousdomaineId ?? null,
          competenceId: dto.competenceId ?? null,
        },
        select: { id: true, name: true, description: true, type: true, domaineId: true, sousdomaineId: true, competenceId: true },
      });
      return created;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      }
      throw e;
    }
  }

  /* ===================== FIND ONE — FULL COMPONENT OBJECTS ===================== */
  async findOne(id: number, depth = 10) {
    const row = await this.prisma.typeInfrastructure.findUnique({
      where: { id },
      select: this.fullSelect,
    });
    if (!row) throw new NotFoundException({ message: 'Type introuvable.', messageE: 'Type not found.' });

    const base = this.materialize(row);
    const compIds = toIdArray(base.composant);

    // Par défaut : on va profond (10 niveaux) et on renvoie TOUT sur les composants
    const cache = new Map<number, any>([[base.id, base]]);
    const composant = await this.expandFullTreeByIds(
      compIds,
      Math.max(1, Math.min(Number(depth ?? 10), 10)),
      new Set<number>([base.id]),
      cache,
    );

    return { ...base, composant };
  }

  /* ===================== UPDATE ===================== */
  async update(id: number, dto: UpdateTypeDto) {
    await this.ensureExists(id);
    if (typeof dto.domaineId === 'number') {
      const exists = await this.prisma.domaine.count({ where: { id: dto.domaineId } });
      if (!exists) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });
    }
    if (typeof dto.sousdomaineId === 'number') {
      const exists = await this.prisma.sousDomaine.count({ where: { id: dto.sousdomaineId } });
      if (!exists) throw new BadRequestException({ message: 'Sous-domaine invalide.', messageE: 'Invalid subdomain.' });
    }

    const normalized = normalizeTypePayload(dto);

    try {
      const updated = await this.prisma.typeInfrastructure.update({
        where: { id },
        data: {
          name: normalized.name,
          description: normalized.description,
          type: normalized.type,
          location: normalized.location,
          images: normalized.images,
          attribus: normalized.attribus,
          composant: normalized.composant, // IDs
          domaineId: dto.domaineId,
          competenceId: dto.competenceId,
          sousdomaineId: dto.sousdomaineId,
        },
        select: this.fullSelect,
      });

      const base = this.materialize(updated);
      const comp = await this.expandFullTreeByIds(toIdArray(base.composant), 1, new Set<number>([base.id]));
      return { ...base, composant: comp };
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      throw e;
    }
  }

  /* ===================== FORM ===================== */
  async form(id: number) {
    const row = await this.findOne(id, 1); // enfants directs pour édition
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      domaineId: row.domaineId,
      sousdomaineId: row.sousdomaineId,
      form: { attribus: row.attribus, composant: row.composant },
      note: 'ATTRIBUTS : clés en MAJ SANS ACCENT. ENUM: CSV → array. Composant stocké en IDs mais retourné en objets complets (1 niveau ici).',
    };
  }

  /* ===================== USAGE ===================== */
  async usage(id: number) {
    const where: any = { id_type_infrastructure: id };
    type GB = { _count: { _all: number } };
    type GBRegion = GB & { regionId: number | null };
    type GBDep   = GB & { departementId: number | null };
    type GBArr   = GB & { arrondissementId: number | null };
    type GBCom   = GB & { communeId: number | null };

    const [total, byRegion, byDep, byArr, byCom] = await Promise.all([
      this.prisma.infrastructure.count({ where }),
      this.prisma.infrastructure.groupBy({ by: ['regionId'],        where, _count: { _all: true } }) as unknown as Promise<GBRegion[]>,
      this.prisma.infrastructure.groupBy({ by: ['departementId'],   where, _count: { _all: true } }) as unknown as Promise<GBDep[]>,
      this.prisma.infrastructure.groupBy({ by: ['arrondissementId'],where, _count: { _all: true } }) as unknown as Promise<GBArr[]>,
      this.prisma.infrastructure.groupBy({ by: ['communeId'],       where, _count: { _all: true } }) as unknown as Promise<GBCom[]>,
    ]);

    return {
      total,
      byRegion:        byRegion.map(x => ({ regionId: x.regionId, count: x._count._all })),
      byDepartement:   byDep.map(x   => ({ departementId: x.departementId, count: x._count._all })),
      byArrondissement:byArr.map(x   => ({ arrondissementId: x.arrondissementId, count: x._count._all })),
      byCommune:       byCom.map(x   => ({ communeId: x.communeId, count: x._count._all })),
    };
  }

  /* ===================== REMOVE ===================== */
  async remove(id: number) {
    const used = await this.prisma.infrastructure.count({ where: { id_type_infrastructure: id } });
    if (used > 0) {
      throw new BadRequestException({
        message: 'Type utilisé par des infrastructures — suppression interdite.',
        messageE: 'Type is used by infrastructures — deletion forbidden.',
      });
    }
    await this.prisma.typeInfrastructure.delete({ where: { id } });
  }

  /* ===================== Guard ===================== */
  private async ensureExists(id: number) {
    const ok = await this.prisma.typeInfrastructure.count({ where: { id } });
    if (!ok) throw new NotFoundException({ message: 'Type introuvable.', messageE: 'Type not found.' });
  }
}
