import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';

/* ------------------------------- Helpers ------------------------------- */

function isPlainObject(v: any) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

/** Uppercase + suppression des accents + trim */
function upperNoAccents(input: string): string {
  return (input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/** Split sur , ; | et normalise (trim, filtre vides) */
function csvToArray(input: string): string[] {
  return (input ?? '')
    .split(/[,\|;]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

/** Enum array normalisé (string, trim, unique, sans valeurs vides) */
function normalizeEnumArray(arr: any[]): string[] {
  const out = arr
    .map(v => (v === null || v === undefined) ? '' : String(v).trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const v of out) { if (!seen.has(v)) { seen.add(v); uniq.push(v); } }
  return uniq;
}

/**
 * Règles d’un attribut:
 *  - key → MAJ SANS ACCENT
 *  - si type === 'enm' => 'enum'
 *  - si type === 'string' ET value contient des séparateurs => forcer enum + value=array
 *  - si type === 'enum' ET value string => CSV → array
 *  - si type === 'enum' ET value scalaire => [value]
 */
function normalizeOneAttribut(attr: any): any {
  const base = isPlainObject(attr) ? attr : {};
  const out: any = { ...base };

  if (out.key !== undefined && out.key !== null) out.key = upperNoAccents(String(out.key));

  let t = typeof out.type === 'string' ? out.type.trim().toLowerCase() : out.type;
  if (t === 'enm') t = 'enum';

  // string délimitée => enum
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

  if (t === 'string' && typeof out.value !== 'string' && out.value !== null && out.value !== undefined) {
    out.value = String(out.value);
  }

  out.type = t ?? out.type;
  return out;
}
function normalizeAttribus(input: any): any[] {
  const arr = Array.isArray(input) ? input : [];
  return arr.filter(it => it && typeof it === 'object').map(normalizeOneAttribut);
}

/** Injecte ETAT/LATITUDE/LONGITUDE si absents (clés MAJ sans accent) */
function ensureBaseAttributes(attribus: any[]): any[] {
  const keys = new Set(attribus.map(a => upperNoAccents(String(a?.key ?? ''))));

  // ETAT
  if (!keys.has('ETAT')) {
    attribus.push({
      key: 'ETAT',
      type: 'enum',
      value: ['EXCELLENT', 'BON', 'PASSABLE', 'MAUVAIS', 'TRES MAUVAIS'],
    });
  }

  // LATITUDE / LONGITUDE
  if (!keys.has('LATITUDE')) attribus.push({ key: 'LATITUDE', type: 'number', value: null });
  if (!keys.has('LONGITUDE')) attribus.push({ key: 'LONGITUDE', type: 'number', value: null });
  if (!keys.has('DESCRIPTION')) attribus.push({ key: 'DESCRIPTION', type: 'string', value: null });

  // re-normaliser (au cas où)
  return normalizeAttribus(attribus);
}

/** composant entrée souple → number[] uniques */
function toIdArray(input: any): number[] {
  const arr = Array.isArray(input) ? input : input == null ? [] : [input];
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

/** Normalisation globale du payload Type */
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

  // ATTRIBUS : normalisation + base attributes
  if (out.attribus !== undefined) {
    out.attribus = normalizeAttribus(out.attribus);
    out.attribus = ensureBaseAttributes(out.attribus);
  }

  // COMPOSANT : stocké en DB comme number[]
  if (out.composant !== undefined) {
    out.composant = toIdArray(out.composant);
  }

  // description string si fournie
  if (out.description !== undefined && out.description !== null && typeof out.description !== 'string') {
    out.description = String(out.description);
  }
  return out;
}

/* -------------------------------- Service ------------------------------- */

type ComponentSummary = { id: number; name: string; type: 'SIMPLE'|'COMPLEXE'; description: string | null };

@Injectable()
export class TypesService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------ utils composants (expansion des IDs -> objets) ------------ */

  private async expandComponentIdsToObjects(ids: number[]): Promise<Map<number, ComponentSummary>> {
    if (!ids.length) return new Map();
    const rows = await this.prisma.typeInfrastructure.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, type: true, description: true },
    });
    return new Map(rows.map(r => [r.id, { id: r.id, name: r.name, type: r.type as any, description: r.description ?? null }]));
  }

  private materializeComposants(composantIds: any, dict: Map<number, ComponentSummary>): ComponentSummary[] {
    const ids = toIdArray(composantIds);
    const out: ComponentSummary[] = [];
    for (const id of ids) {
      const found = dict.get(id);
      if (found) out.push(found);
    }
    return out;
  }

  /* ----------------------------- LIST (GET ALL) ----------------------------- */

  async list(params: {
    page: number; pageSize: number; sort?: Record<string,'asc'|'desc'>;
    q?: string; type?: string; domaineId?: number; sousdomaineId?: number; competenceId?: number;
  }) {
    const { page, pageSize, sort, q, type, domaineId, sousdomaineId, competenceId } = params;
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
        select: {
          id: true, name: true, description: true, type: true,
          location: true, images: true, attribus: true, composant: true, // composant = number[]
          domaineId: true, domaine: { select: { id: true, nom: true, code: true } },
          sousdomaineId: true, sousdomaine: { select: { id: true, nom: true, code: true } },
          competenceId: true, competence: true,
          created_at: true, updated_at: true,
        },
      }),
    ]);

    // Batch expand composants
    const allIds = new Set<number>();
    for (const it of itemsRaw) {
      for (const id of toIdArray(it.composant)) allIds.add(id);
    }
    const dict = await this.expandComponentIdsToObjects(Array.from(allIds));

    const items = itemsRaw.map(it => ({
      ...it,
      attribus: Array.isArray(it.attribus) ? it.attribus : [],
      location: isPlainObject(it.location) ? it.location : {},
      images: Array.isArray(it.images) ? it.images : [],
      composant: this.materializeComposants(it.composant, dict), // ← array d’objets
    }));

    return { total, items };
  }

  /* -------------------------------- CREATE -------------------------------- */

  async create(dto: CreateTypeDto) {
    // FK minimales
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

    // (Optionnel) Filtrer aux IDs existants
    const compIds = toIdArray(normalized.composant);
    let keepIds = compIds;
    if (compIds.length) {
      const found = await this.prisma.typeInfrastructure.findMany({ where: { id: { in: compIds } }, select: { id: true } });
      const set = new Set(found.map(f => f.id));
      keepIds = compIds.filter(id => set.has(id));
    }

    const created = await this.prisma.typeInfrastructure.create({
      data: {
        name: normalized.name,
        description: normalized.description ?? null,
        type: normalized.type,
        location: normalized.location,
        images: normalized.images,
        attribus: normalized.attribus,
        // en DB: on stocke les IDs
        composant: keepIds,
        domaineId: dto.domaineId ?? null,
        sousdomaineId: dto.sousdomaineId ?? null,
        competenceId: dto.competenceId ?? null,
      },
      select: { id: true, name: true, description: true, type: true, domaineId: true, sousdomaineId: true, competenceId: true },
    });

    return created;
  }

  /* -------------------------------- FIND ONE ------------------------------ */

  async findOne(id: number) {
    const row = await this.prisma.typeInfrastructure.findUnique({
      where: { id },
      select: {
        id: true, name: true, description: true, type: true,
        location: true, images: true, attribus: true, composant: true, // number[]
        domaineId: true, sousdomaineId: true, competenceId: true,
        created_at: true, updated_at: true,
      },
    });
    if (!row) throw new NotFoundException({ message: 'Type introuvable.', messageE: 'Type not found.' });

    const dict = await this.expandComponentIdsToObjects(toIdArray(row.composant));

    return {
      ...row,
      attribus: Array.isArray(row.attribus) ? row.attribus : [],
      location: isPlainObject(row.location) ? row.location : {},
      images: Array.isArray(row.images) ? row.images : [],
      composant: this.materializeComposants(row.composant, dict), // ← objets
    };
  }

  /* -------------------------------- UPDATE -------------------------------- */

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

    // Optionnel: valider composant IDs
    let keepIds: number[] | undefined = undefined;
    if (normalized.composant !== undefined) {
      const compIds = toIdArray(normalized.composant);
      if (compIds.length) {
        const found = await this.prisma.typeInfrastructure.findMany({ where: { id: { in: compIds } }, select: { id: true } });
        const set = new Set(found.map(f => f.id));
        keepIds = compIds.filter(x => set.has(x));
      } else {
        keepIds = [];
      }
    }

    const updated = await this.prisma.typeInfrastructure.update({
      where: { id },
      data: {
        name: normalized.name,
        description: normalized.description,
        type: normalized.type,
        location: normalized.location,
        images: normalized.images,
        attribus: normalized.attribus,
        // stock en DB = IDs
        ...(keepIds !== undefined ? { composant: keepIds } : {}),
        domaineId: dto.domaineId,
        competenceId: dto.competenceId,
        sousdomaineId: dto.sousdomaineId,
      },
      select: {
        id: true, name: true, description: true, type: true,
        location: true, images: true, attribus: true, composant: true,
        domaineId: true, sousdomaineId: true,
        updated_at: true,
      },
    });

    const dict = await this.expandComponentIdsToObjects(toIdArray(updated.composant));

    return {
      ...updated,
      attribus: Array.isArray(updated.attribus) ? updated.attribus : [],
      location: isPlainObject(updated.location) ? updated.location : {},
      images: Array.isArray(updated.images) ? updated.images : [],
      composant: this.materializeComposants(updated.composant, dict), // ← objets
    };
  }

  /* -------------------------------- FORM ---------------------------------- */

  async form(id: number) {
    const row = await this.findOne(id);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      domaineId: (row as any).domaineId,
      sousdomaineId: (row as any).sousdomaineId,
      form: {
        attribus: row.attribus,
        composant: row.composant, // déjà objets
      },
      note: 'ATTRIBUTS normalisés: key en MAJ SANS ACCENT; enum/enm et CSV → array. ETAT/LATITUDE/LONGITUDE injectés si absents.',
    };
  }

  /* -------------------------------- USAGE --------------------------------- */

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

  /* -------------------------------- REMOVE -------------------------------- */

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

  private async ensureExists(id: number) {
    const ok = await this.prisma.typeInfrastructure.count({ where: { id } });
    if (!ok) throw new NotFoundException({ message: 'Type introuvable.', messageE: 'Type not found.' });
  }
}
