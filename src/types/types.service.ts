import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';

/* ------------------------------- Helpers ------------------------------- */

function isPlainObject(v: any) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function csvToArray(input: string): string[] {
  return input.split(/[,\|;]+/g).map(s => s.trim()).filter(Boolean);
}

function normalizeOneAttribut(attr: any): any {
  const base = isPlainObject(attr) ? attr : {};
  const out: any = { ...base };
  const t = typeof out.type === 'string' ? out.type.toLowerCase() : out.type;
  if (t === 'enum') {
    if (out.value === null || out.value === undefined) {
      out.value = null;
    } else if (typeof out.value === 'string') {
      out.value = csvToArray(out.value);
    } else if (Array.isArray(out.value)) {
      // ok
    } else {
      out.value = [String(out.value)];
    }
  }
  return out;
}
function normalizeAttribus(input: any): any[] {
  const arr = Array.isArray(input) ? input : [];
  return arr.filter(it => it && typeof it === 'object').map(normalizeOneAttribut);
}
function normalizeOneComposant(c: any): any {
  const n: any = isPlainObject(c) ? { ...c } : {};
  n.type = typeof n.type === 'string' ? n.type.toUpperCase() : n.type;
  if (n.type !== 'SIMPLE' && n.type !== 'COMPLEXE') n.type = 'SIMPLE';
  n.location = isPlainObject(n.location) ? n.location : {};
  n.images   = Array.isArray(n.images) ? n.images : [];
  n.attribus = normalizeAttribus(n.attribus);
  // description (optionnelle) — string si présent
  if (n.description !== undefined && typeof n.description !== 'string') n.description = String(n.description);
  if (Array.isArray(n.composant)) n.composant = n.composant.map(normalizeOneComposant);
  return n;
}
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
  if (out.attribus !== undefined) out.attribus = normalizeAttribus(out.attribus);
  if (out.composant !== undefined) {
    const list = Array.isArray(out.composant) ? out.composant : [];
    out.composant = list.map(normalizeOneComposant);
  }
  // description string si fournie
  if (out.description !== undefined && out.description !== null && typeof out.description !== 'string') {
    out.description = String(out.description);
  }
  return out;
}

/* -------------------------------- Service ------------------------------- */

@Injectable()
export class TypesService {
  constructor(private readonly prisma: PrismaService) {}

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

    const [total, items] = await this.prisma.$transaction([
      this.prisma.typeInfrastructure.count({ where }),
      this.prisma.typeInfrastructure.findMany({
        where,
        orderBy: sort ?? { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, name: true, description: true, type: true,
          location: true, images: true, attribus: true, composant: true,
          domaineId: true, domaine: { select: { id: true, nom: true, code: true } }, sousdomaineId: true, sousdomaine: { select: { id: true, nom: true, code: true } }, competenceId: true, competence: true,
          created_at: true, updated_at: true,
        },
      }),
    ]);
    return { total, items };
  }

  async create(dto: CreateTypeDto) {
    // vérif FK (si fournis)
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
          composant: normalized.composant,
          domaineId: dto.domaineId ?? null,
          sousdomaineId: dto.sousdomaineId ?? null,
          competenceId: dto.competenceId ?? null,
        },
        select: { id: true, name: true, description: true, type: true, domaineId: true, sousdomaineId: true, competenceId: true },
      });
      return created;
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      throw e;
    }
  }

  async findOne(id: number) {
    const row = await this.prisma.typeInfrastructure.findUnique({
      where: { id },
      select: {
        id: true, name: true, description: true, type: true,
        location: true, images: true, attribus: true, composant: true,
        domaineId: true, sousdomaineId: true, competenceId: true,
        created_at: true, updated_at: true,
      },
    });
    if (!row) throw new NotFoundException({ message: 'Type introuvable.', messageE: 'Type not found.' });

    return {
      ...row,
      attribus: Array.isArray(row.attribus) ? row.attribus : [],
      composant: Array.isArray(row.composant) ? row.composant : [],
      location: isPlainObject(row.location) ? row.location : {},
      images: Array.isArray(row.images) ? row.images : [],
    };
  }

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
          composant: normalized.composant,
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

      return {
        ...updated,
        attribus: Array.isArray(updated.attribus) ? updated.attribus : [],
        composant: Array.isArray(updated.composant) ? updated.composant : [],
        location: isPlainObject(updated.location) ? updated.location : {},
        images: Array.isArray(updated.images) ? updated.images : [],
      };
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException({ message: 'Nom déjà utilisé.', messageE: 'Name already in use.' });
      throw e;
    }
  }

  async form(id: number) {
    const row = await this.findOne(id);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      domaineId: row.domaineId,
      sousdomaineId: row.sousdomaineId,
      form: { attribus: row.attribus, composant: row.composant },
      note: 'Attribut type="enum": value en CSV devient array côté service. Composant peut contenir "description".',
    };
  }

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
