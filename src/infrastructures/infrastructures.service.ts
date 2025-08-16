// src/infrastructures/infrastructures.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInfrastructureDto } from './dto/create-infra.dto';
import { UpdateInfrastructureDto } from './dto/update-infra.dto';
import { uploadImageToCloudinary } from '../utils/cloudinary';

type Order = Record<string, 'asc' | 'desc'>;

/* ---------- helpers ---------- */
function ensureObject(v: any) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function ensureArray<T = any>(v: any): T[] { return Array.isArray(v) ? v : []; }
function toStrId(id: bigint | number | string): string {
  if (typeof id === 'bigint') return id.toString();
  if (typeof id === 'number') return String(id);
  return id;
}

@Injectable()
export class InfrastructuresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Upload un tableau d’images : base64 -> Cloudinary, http -> conservé, autres -> ignoré */
  private async toCloudinaryUrls(images: any[], folder: string): Promise<string[]> {
    const src = Array.isArray(images) ? images : [];
    const out: string[] = [];
    for (const x of src) {
      if (typeof x !== 'string') continue;
      try {
        if (/^data:(image\/.+|application\/pdf);base64,/.test(x)) {
          out.push(await uploadImageToCloudinary(x, folder));
        } else if (x.startsWith('http')) {
          out.push(x);
        }
      } catch {
        throw new BadRequestException({
          message: `Image invalide ou upload échoué.`,
          messageE: `Invalid image or upload failed.`,
        });
      }
    }
    return out;
  }

  /* ---------- validations FK ---------- */
  private async ensureTypeExists(id: number) {
    const ok = await this.prisma.typeInfrastructure.count({ where: { id } });
    if (!ok) throw new BadRequestException({ message: 'TypeInfrastructure invalide.', messageE: 'Invalid TypeInfrastructure.' });
  }

  private async ensureTerritoryExists(regionId: number, departementId: number, arrondissementId: number, communeId: number) {
    const [r, d, a, c] = await this.prisma.$transaction([
      this.prisma.region.count({ where: { id: regionId } }),
      this.prisma.departement.count({ where: { id: departementId } }),
      this.prisma.arrondissement.count({ where: { id: arrondissementId } }),
      this.prisma.commune.count({ where: { id: communeId } }),
    ]);
    if (!r || !d || !a || !c) {
      throw new BadRequestException({
        message: 'Territoire invalide (region/departement/arrondissement/commune).',
        messageE: 'Invalid territory IDs.',
      });
    }
  }

  private async ensureClassification(domaineId?: number, sousdomaineId?: number) {
    if (typeof domaineId === 'number') {
      const cnt = await this.prisma.domaine.count({ where: { id: domaineId } });
      if (!cnt) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });
    }
    if (typeof sousdomaineId === 'number') {
      const cnt = await this.prisma.sousDomaine.count({ where: { id: sousdomaineId } });
      if (!cnt) throw new BadRequestException({ message: 'Sous-domaine invalide.', messageE: 'Invalid subdomain.' });
    }
  }

  /* ---------- LIST ---------- */
  async list(params: {
    page: number; pageSize: number; sort?: Order;
    regionId?: number; departementId?: number; arrondissementId?: number; communeId?: number;
    typeId?: number; type?: string; q?: string; domaineId?: number; sousdomaineId?: number;
    created_from?: string; created_to?: string;
  }) {
    const {
      page, pageSize, sort,
      regionId, departementId, arrondissementId, communeId,
      typeId, type, q, domaineId, sousdomaineId, created_from, created_to,
    } = params;

    const where: any = {};
    if (typeof regionId === 'number') where.regionId = regionId;
    if (typeof departementId === 'number') where.departementId = departementId;
    if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
    if (typeof communeId === 'number') where.communeId = communeId;
    if (typeof typeId === 'number') where.id_type_infrastructure = typeId;
    if (typeof domaineId === 'number') where.domaineId = domaineId;
    if (typeof sousdomaineId === 'number') where.sousdomaineId = sousdomaineId;
    if (type) where.type = type;
    if (q) {
      where.OR = [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (created_from || created_to) {
      where.created_at = {};
      if (created_from) where.created_at.gte = new Date(created_from + 'T00:00:00Z');
      if (created_to)   where.created_at.lte = new Date(created_to   + 'T23:59:59Z');
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.infrastructure.count({ where }),
      this.prisma.infrastructure.findMany({
        where,
        orderBy: sort ?? { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          id_type_infrastructure: true,
          name: true,
          description: true,
          existing_infrastructure: true,
          type: true,
          regionId: true, region: true, departementId: true, departement: true, arrondissementId: true, arrondissement: true, communeId: true, commune: true,
          domaineId: true, sousdomaineId: true,
          location: true, images: true, attribus: true, composant: true,
          created_at: true, updated_at: true,
        },
      }),
    ]);

    const items = rows.map(r => ({ ...r, id: toStrId(r.id) }));
    return { total, items };
  }

  /* ---------- CREATE (Cloudinary + composant JSON conservé + duplication enfants indépendants) ---------- */
  async create(dto: CreateInfrastructureDto) {
    await this.ensureTypeExists(dto.typeId);
    await this.ensureTerritoryExists(dto.regionId, dto.departementId, dto.arrondissementId, dto.communeId);
    await this.ensureClassification(dto.domaineId, dto.sousdomaineId);

    const parentFolder = `infrastructures/${dto.communeId}`;

    // Normalise le JSON des composants (conservation d’images) + upload
    const normalizedComponents: any[] = [];
    for (const c of ensureArray(dto.composant)) {
      const imagesUrls = await this.toCloudinaryUrls(ensureArray(c.images), `${parentFolder}/components`);
      normalizedComponents.push({
        ...c,
        type: (c.type ?? 'SIMPLE').toUpperCase(),
        location: ensureObject(c.location),
        images: imagesUrls,                 // ✅ on conserve images (URLs)
        attribus: ensureObject(c.attribus),
      });
    }

    const dataParent: any = {
      id_type_infrastructure: dto.typeId,
      name: dto.name,
      description: dto.description ?? null,
      existing_infrastructure: dto.existing_infrastructure ?? true,
      type: dto.type, // SIMPLE|COMPLEXE (upper par DTO)
      regionId: dto.regionId,
      departementId: dto.departementId,
      arrondissementId: dto.arrondissementId,
      communeId: dto.communeId,
      domaineId: dto.domaineId ?? null,
      sousdomaineId: dto.sousdomaineId ?? null,
      location: ensureObject(dto.location),
      images: await this.toCloudinaryUrls(dto.images, parentFolder),
      attribus: ensureObject(dto.attribus),
      composant: normalizedComponents,      // ✅ JSON conservé (indépendant)
    };

    return await this.prisma.$transaction(async (tx) => {
      // 1) crée le parent (avec JSON composant déjà prêt)
      const parent = await tx.infrastructure.create({
        data: dataParent,
        select: { id: true },
      });
      const parentIdStr = toStrId(parent.id);

      // 2) crée des records ENFANTS indépendants (aucun lien stocké dans le JSON parent)
      for (const c of normalizedComponents) {
        await tx.infrastructure.create({
          data: {
            id_type_infrastructure: dto.typeId,
            name: `${dto.name} — ${c.name ?? 'Composant'}`,
            description: c.description ?? null,
            existing_infrastructure: c.existingInfrastructure ?? true,
            type: c.type, // déjà upper
            regionId: dto.regionId,
            departementId: dto.departementId,
            arrondissementId: dto.arrondissementId,
            communeId: dto.communeId,
            domaineId: dto.domaineId ?? null,
            sousdomaineId: dto.sousdomaineId ?? null,
            location: c.location,
            images: c.images,                 // ✅ mêmes URLs que dans le JSON
            attribus: c.attribus,
            composant: Array.isArray(c.composant) ? c.composant : [],
          },
          select: { id: true },
        });
      }

      return { id: parentIdStr };
    });
  }

  /* ---------- GET ONE (include=type,territory ; composants = JSON tel quel) ---------- */
  async findOne(idStr: string, include?: string[]) {
    const id = BigInt(idStr);
    const row = await this.prisma.infrastructure.findUnique({
      where: { id },
      select: {
        id: true,
        id_type_infrastructure: true,
        name: true,
        description: true,
        existing_infrastructure: true,
        type: true,
        regionId: true, departementId: true, arrondissementId: true, communeId: true,
        domaineId: true, sousdomaineId: true,
        location: true, images: true, attribus: true, composant: true,
        created_at: true, updated_at: true,
        ...(include?.includes('type') ? { typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } } } : {}),
        ...(include?.includes('territory') ? {
          region:        { select: { id: true, nom: true } },
          departement:   { select: { id: true, nom: true } },
          arrondissement:{ select: { id: true, nom: true } },
          commune:       { select: { id: true, nom: true } },
        } : {}),
      },
    });
    if (!row) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

    // Pas de "composantsDetail" fetch (indépendance). On renvoie le JSON tel quel.
    return { ...row, id: toStrId(row.id) };
  }

  /* ---------- UPDATE (met à jour le parent ; composants JSON conservés/écrasés ; enfants non touchés) ---------- */
  async update(idStr: string, dto: UpdateInfrastructureDto) {
    const id = BigInt(idStr);
    const current = await this.prisma.infrastructure.findUnique({
      where: { id },
      select: {
        id: true, id_type_infrastructure: true, name: true,
        regionId: true, departementId: true, arrondissementId: true, communeId: true,
        domaineId: true, sousdomaineId: true,
      },
    });
    if (!current) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

    const effTypeId = dto.typeId ?? current.id_type_infrastructure;
    await this.ensureTypeExists(effTypeId);

    const effRegion = dto.regionId ?? current.regionId;
    const effDep    = dto.departementId ?? current.departementId;
    const effArr    = dto.arrondissementId ?? current.arrondissementId;
    const effCom    = dto.communeId ?? current.communeId;
    await this.ensureTerritoryExists(effRegion, effDep, effArr, effCom);

    const effDom  = dto.domaineId ?? current.domaineId ?? undefined;
    const effSdom = dto.sousdomaineId ?? current.sousdomaineId ?? undefined;
    await this.ensureClassification(effDom, effSdom);

    const folder = `infrastructures/${effCom}`;

    // Si des composants sont fournis, on les **remplace** dans le JSON parent (indépendance) après normalisation images.
    let newComposant: any[] | undefined = undefined;
    if (Array.isArray(dto.composant)) {
      newComposant = [];
      for (const c of dto.composant) {
        const imgs = await this.toCloudinaryUrls(ensureArray(c.images), `${folder}/components`);
        newComposant.push({
          ...c,
          type: (c.type ?? 'SIMPLE').toUpperCase(),
          location: ensureObject(c.location),
          images: imgs,                    // ✅ conserver images
          attribus: ensureObject(c.attribus),
        });
      }
    }

    const data: any = {
      id_type_infrastructure: dto.typeId,
      name: dto.name,
      description: dto.description,
      existing_infrastructure: dto.existing_infrastructure,
      type: dto.type,
      regionId: dto.regionId,
      departementId: dto.departementId,
      arrondissementId: dto.arrondissementId,
      communeId: dto.communeId,
      domaineId: dto.domaineId,
      sousdomaineId: dto.sousdomaineId,
      location: dto.location ? ensureObject(dto.location) : undefined,
      images: dto.images ? await this.toCloudinaryUrls(dto.images, folder) : undefined,
      attribus: dto.attribus ? ensureObject(dto.attribus) : undefined,
      composant: newComposant,  // si fourni, on écrase ; sinon laissé undefined (pas de changement)
    };

    const updated = await this.prisma.infrastructure.update({
      where: { id }, data,
      select: {
        id: true, id_type_infrastructure: true, name: true, description: true, type: true,
        regionId: true, departementId: true, arrondissementId: true, communeId: true,
        domaineId: true, sousdomaineId: true,
        location: true, images: true, attribus: true, composant: true, updated_at: true,
      },
    });

    return { ...updated, id: toStrId(updated.id) };
  }

  /* ---------- DELETE (indépendant : ne touche pas d’éventuels enfants) ---------- */
  async remove(idStr: string) {
    const id = BigInt(idStr);
    const exists = await this.prisma.infrastructure.count({ where: { id } });
    if (!exists) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });
    await this.prisma.infrastructure.delete({ where: { id } });
  }

  /* ---------- EXPORT CSV ---------- */
  async exportCsv(params: Parameters<InfrastructuresService['list']>[0]) {
    const full = await this.list({ ...params, page: 1, pageSize: 100000, sort: params.sort });
    const headers = [
      'id','name','description','type','existing_infrastructure',
      'id_type_infrastructure',
      'regionId','departementId','arrondissementId','communeId',
      'domaineId','sousdomaineId',
      'created_at','updated_at'
    ];
    const rows = full.items.map((r: any) => ([
      r.id, r.name, r.description ?? '', r.type, r.existing_infrastructure ? 1 : 0,
      r.id_type_infrastructure,
      r.regionId, r.departementId, r.arrondissementId, r.communeId,
      r.domaineId ?? '', r.sousdomaineId ?? '',
      r.created_at?.toISOString?.() ?? '', r.updated_at?.toISOString?.() ?? ''
    ].map(v => (typeof v === 'string' && v.includes(',')) ? `"${v.replace(/"/g,'""')}"` : v).join(',')));
    return [headers.join(','), ...rows].join('\n');
  }

  /* ---------- BULK ---------- */
  async validateBulk(items: CreateInfrastructureDto[]) {
    const errors: { index: number; message: string; messageE: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      try {
        await this.ensureTypeExists(it.typeId);
        await this.ensureTerritoryExists(it.regionId, it.departementId, it.arrondissementId, it.communeId);
        await this.ensureClassification(it.domaineId, it.sousdomaineId);
        if (!it.name) throw new Error('name requis');
        if (!it.type) throw new Error('type requis');
        if (!it.location) throw new Error('location requis');
        if (!it.attribus) throw new Error('attribus requis');
      } catch (e: any) {
        errors.push({ index: i, message: `Ligne invalide: ${e.message ?? e}`, messageE: `Invalid row: ${e.message ?? e}` });
      }
    }
    return { valid: errors.length === 0, errors, count: items.length };
  }

  async bulk(items: CreateInfrastructureDto[]) {
    const result: { index: number; id?: string; error?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      try {
        const created = await this.create(items[i]);
        result.push({ index: i, id: created.id });
      } catch (e: any) {
        result.push({ index: i, error: e?.message ?? 'unknown error' });
      }
    }
    return result;
  }
}
