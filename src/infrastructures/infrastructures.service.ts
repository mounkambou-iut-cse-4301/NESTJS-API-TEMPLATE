// // import { uploadImageToCloudinary } from './../utils/cloudinary';
// // import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// // import { PrismaService } from '../prisma/prisma.service';
// // import { CreateInfrastructureDto } from './dto/create-infra.dto';
// // import { UpdateInfrastructureDto } from './dto/update-infra.dto';

// // type Order = Record<string, 'asc' | 'desc'>;

// // /* ---------- helpers ---------- */
// // function ensureObject(v: any) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
// // function ensureArray<T = any>(v: any): T[] { return Array.isArray(v) ? v : []; }
// // function toStrId(id: bigint | number | string): string {
// //   if (typeof id === 'bigint') return id.toString();
// //   if (typeof id === 'number') return String(id);
// //   return id;
// // }
// // type Scope = {
// //   regionId?: number;
// //   departementId?: number;
// //   arrondissementId?: number;
// //   communeId?: number;
// //   type?: 'SIMPLE'|'COMPLEXE';
// //   typeId?: number;        // id_type_infrastructure
// //   domaineId?: number;
// //   sousdomaineId?: number;
// //   competenceId?: number;
// // };

// // const ALLOWED_ETATS = ['excellent','bon','passable','mauvais','tres mauvais'] as const;
// // type Etat = typeof ALLOWED_ETATS[number];

// // function buildWhere(q: Scope) {
// //   const where: any = {};
// //   if (q.regionId)        where.regionId = Number(q.regionId);
// //   if (q.departementId)   where.departementId = Number(q.departementId);
// //   if (q.arrondissementId)where.arrondissementId = Number(q.arrondissementId);
// //   if (q.communeId)       where.communeId = Number(q.communeId);
// //   if (q.type)            where.type = q.type;
// //   if (q.typeId)          where.id_type_infrastructure = Number(q.typeId);
// //   if (q.domaineId)       where.domaineId = Number(q.domaineId);
// //   if (q.sousdomaineId)   where.sousdomaineId = Number(q.sousdomaineId);
// //   if (q.competenceId)    where.competenceId = Number(q.competenceId);
// //   return where;
// // }

// // /** Clause WHERE SQL uniquement pour colonnes numériques whitelistées. */
// // function sqlWhereNumeric(where: Record<string, any>) {
// //   const allowed = [
// //     'regionId','departementId','arrondissementId','communeId',
// //     'id_type_infrastructure','domaineId','sousdomaineId','competenceId',
// //   ];
// //   const parts: string[] = [];
// //   for (const [k,v] of Object.entries(where)) {
// //     if (v === undefined || v === null) continue;
// //     if (allowed.includes(k)) parts.push(`${k}=${Number(v)}`);
// //   }
// //   return parts.length ? 'WHERE '+parts.join(' AND ') : '';
// // }

// // /** Restreint le périmètre à la commune du user connecté si définie. */
// // function applyUserCommune(where: any, req: any) {
// //   const userCommuneId = req?.user?.communeId as number | undefined;
// //   if (userCommuneId) {
// //     // On force la commune et on retire d’éventuels filtres territoriaux plus larges
// //     where.regionId = undefined;
// //     where.departementId = undefined;
// //     where.arrondissementId = undefined;
// //     where.communeId = userCommuneId;
// //   }
// //   return where;
// // }

// // @Injectable()
// // export class InfrastructuresService {
// //   constructor(private readonly prisma: PrismaService) {}

// //   /** Upload un tableau d’images : base64 -> Cloudinary, http -> conservé, autres -> ignoré */
// //   private async toCloudinaryUrls(images: any[], folder: string): Promise<string[]> {
// //     const src = Array.isArray(images) ? images : [];
// //     const out: string[] = [];
// //     for (const x of src) {
// //       if (typeof x !== 'string') continue;
// //       try {
// //         if (/^data:(image\/.+|application\/pdf);base64,/.test(x)) {
// //           out.push(await uploadImageToCloudinary(x, folder));
// //         } else if (x.startsWith('http')) {
// //           out.push(x);
// //         }
// //       } catch {
// //         throw new BadRequestException({
// //           message: `Image invalide ou upload échoué.`,
// //           messageE: `Invalid image or upload failed.`,
// //         });
// //       }
// //     }
// //     return out;
// //   }

// //   /* ---------- validations FK ---------- */
// //   private async ensureTypeExists(id: number) {
// //     const ok = await this.prisma.typeInfrastructure.count({ where: { id } });
// //     if (!ok) throw new BadRequestException({ message: 'TypeInfrastructure invalide.', messageE: 'Invalid TypeInfrastructure.' });
// //   }

// //   private async ensureTerritoryExists(regionId: number, departementId: number, arrondissementId: number, communeId: number) {
// //     const [r, d, a, c] = await this.prisma.$transaction([
// //       this.prisma.region.count({ where: { id: regionId } }),
// //       this.prisma.departement.count({ where: { id: departementId } }),
// //       this.prisma.arrondissement.count({ where: { id: arrondissementId } }),
// //       this.prisma.commune.count({ where: { id: communeId } }),
// //     ]);
// //     if (!r || !d || !a || !c) {
// //       throw new BadRequestException({
// //         message: 'Territoire invalide (region/departement/arrondissement/commune).',
// //         messageE: 'Invalid territory IDs.',
// //       });
// //     }
// //   }

// //   private async ensureClassification(domaineId?: number, sousdomaineId?: number, effComp?: number | null) {
// //     if (typeof domaineId === 'number') {
// //       const cnt = await this.prisma.domaine.count({ where: { id: domaineId } });
// //       if (!cnt) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });
// //     }
// //     if (typeof sousdomaineId === 'number') {
// //       const cnt = await this.prisma.sousDomaine.count({ where: { id: sousdomaineId } });
// //       if (!cnt) throw new BadRequestException({ message: 'Sous-domaine invalide.', messageE: 'Invalid subdomain.' });
// //     }
// //   }

// //   private async ensureUserExists(utilisateurId?: number) {
// //     if (typeof utilisateurId !== 'number') return;
// //     const cnt = await this.prisma.utilisateur.count({ where: { id: utilisateurId } });
// //     if (!cnt) throw new BadRequestException({ message: 'Utilisateur (créateur) invalide.', messageE: 'Invalid user (creator).' });
// //   }

// //   /* ---------- LIST ---------- */
// //    async list(params: {
// //     page: number; pageSize: number; sort?: Order;
// //     regionId?: number; departementId?: number; arrondissementId?: number; communeId?: number;
// //     typeId?: number; type?: string; q?: string; domaineId?: number; sousdomaineId?: number; utilisateurId?: number;
// //     created_from?: string; created_to?: string; competenceId?: number;
// //     req?: any; // pour le logging
// //   }) {
// //     const {
// //       page, pageSize, sort,
// //       regionId, departementId, arrondissementId, communeId,
// //       typeId, type, q, domaineId, sousdomaineId, utilisateurId, created_from, created_to,competenceId, req
// //     } = params;
// //   const currentUserId = req?.sub as number | undefined;
// //   const userCommuneId = req?.user.communeId as number | undefined;
// //     const where: any = {};
// //     if (typeof regionId === 'number') where.regionId = regionId;
// //     if (typeof departementId === 'number') where.departementId = departementId;
// //     if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
// //     if (typeof communeId === 'number') where.communeId = communeId;
// //     if (typeof utilisateurId === 'number') where.utilisateurId = utilisateurId;
// // if (typeof competenceId === 'number') where.competenceId = competenceId;
// //     if (currentUserId && userCommuneId) {
// //       where.communeId = userCommuneId; // Limite aux infrastructures de la commune de l'utilisateur
// //     }

// //     if (typeof typeId === 'number') where.id_type_infrastructure = typeId;
// //     if (typeof domaineId === 'number') where.domaineId = domaineId;
// //     if (typeof sousdomaineId === 'number') where.sousdomaineId = sousdomaineId;
// //     if (type) where.type = type;
// //     if (q) {
// //       where.OR = [
// //         { name:        { contains: q, mode: 'insensitive' } },
// //         { description: { contains: q, mode: 'insensitive' } },
// //       ];
// //     }
// //     if (created_from || created_to) {
// //       where.created_at = {};
// //       if (created_from) where.created_at.gte = new Date(created_from + 'T00:00:00Z');
// //       if (created_to)   where.created_at.lte = new Date(created_to   + 'T23:59:59Z');
// //     }

// //     const [total, rows] = await this.prisma.$transaction([
// //       this.prisma.infrastructure.count({ where }),
// //       this.prisma.infrastructure.findMany({
// //         where,
// //         orderBy: sort ?? { created_at: 'desc' },
// //         skip: (page - 1) * pageSize,
// //         take: pageSize,
// //         select: {
// //           id: true,
// //           id_type_infrastructure: true,
// //           typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } },
// //           name: true,
// //           description: true,
// //           existing_infrastructure: true,
// //           type: true,
// //           regionId: true, region: true, departementId: true, departement: true, arrondissementId: true, arrondissement: true, communeId: true, commune: true,
// //           domaineId: true, domaine: { select: { id: true, nom: true, code: true } }, sousdomaineId: true, sousdomaine: { select: { id: true, nom: true, code: true } },
// //           location: true, images: true, attribus: true, composant: true,competenceId: true, competence: { select: { id: true, name: true } },
// //           created_at: true, updated_at: true,
// //         },
// //       }),
// //     ]);

// //     const items = rows.map(r => ({ ...r, id: toStrId(r.id), name_type_infrastructure: r.typeRef.name }));
// //     return { total, items };
// //   }

// //   /* ---------- CREATE (Cloudinary + composant JSON conservé + duplication enfants indépendants) ---------- */
// //   async create(dto: CreateInfrastructureDto, currentUserId?: number) {
// //     await this.ensureTypeExists(dto.typeId);
// //     await this.ensureTerritoryExists(dto.regionId, dto.departementId, dto.arrondissementId, dto.communeId);
// //     await this.ensureClassification(dto.domaineId, dto.sousdomaineId);

// //     // Choix du créateur: dto.utilisateurId > currentUserId > null
// //     const creatorId = dto.utilisateurId ?? currentUserId ?? null;
// //     await this.ensureUserExists(creatorId ?? undefined);

// //     const parentFolder = `infrastructures/${dto.communeId}`;

// //     // Normalise le JSON des composants + upload images composants
// //     const normalizedComponents: any[] = [];
// //     for (const c of ensureArray(dto.composant)) {
// //       const imagesUrls = await this.toCloudinaryUrls(ensureArray(c.images), `${parentFolder}/components`);
// //       normalizedComponents.push({
// //         ...c,
// //         type: (c.type ?? 'SIMPLE').toUpperCase(),
// //         location: ensureObject(c.location),
// //         images: imagesUrls,                 // ✅ on conserve images (URLs)
// //         attribus: ensureObject(c.attribus),
// //       });
// //     }

// //     const dataParent: any = {
// //       id_type_infrastructure: dto.typeId,
// //       name: dto.name,
// //       description: dto.description ?? null,
// //       existing_infrastructure: dto.existing_infrastructure ?? true,
// //       type: dto.type, // SIMPLE|COMPLEXE (upper par DTO)
// //       regionId: dto.regionId,
// //       departementId: dto.departementId,
// //       competenceId: dto.competenceId ?? null,
// //       arrondissementId: dto.arrondissementId,
// //       communeId: dto.communeId,
// //       domaineId: dto.domaineId ?? null,
// //       sousdomaineId: dto.sousdomaineId ?? null,
// //       utilisateurId: creatorId,            // ✅ trace du créateur
// //       location: ensureObject(dto.location),
// //       images: await this.toCloudinaryUrls(dto.images, parentFolder),
// //       attribus: ensureObject(dto.attribus),
// //       composant: normalizedComponents,     // ✅ JSON conservé (indépendant)
// //     };

// //     return await this.prisma.$transaction(async (tx) => {
// //       // 1) crée le parent
// //       const parent = await tx.infrastructure.create({
// //         data: dataParent,
// //         select: { id: true },
// //       });
// //       const parentIdStr = toStrId(parent.id);

// //       // 2) crée des records ENFANTS indépendants (utilisateurId hérité du créateur)
// //       for (const c of normalizedComponents) {
// //         await tx.infrastructure.create({
// //           data: {
// //             id_type_infrastructure: dto.typeId,
// //             name: `${dto.name} — ${c.name ?? 'Composant'}`,
// //             description: c.description ?? null,
// //             existing_infrastructure: c.existingInfrastructure ?? true,
// //             type: c.type,
// //             regionId: dto.regionId,
// //             departementId: dto.departementId,
// //             competenceId: dto.competenceId ?? null,

// //             arrondissementId: dto.arrondissementId,
// //             communeId: dto.communeId,
// //             domaineId: dto.domaineId ?? null,
// //             sousdomaineId: dto.sousdomaineId ?? null,
// //             utilisateurId: creatorId, // ✅
// //             location: c.location,
// //             images: c.images,
// //             attribus: c.attribus,
// //             composant: Array.isArray(c.composant) ? c.composant : [],
// //           },
// //           select: { id: true },
// //         });
// //       }

// //       return { id: parentIdStr };
// //     });
// //   }

// //   /* ---------- GET ONE ---------- */
// //   async findOne(idStr: string, include?: string[]) {
// //     const id = BigInt(idStr);
// //     const row = await this.prisma.infrastructure.findUnique({
// //       where: { id },
// //       select: {
// //         id: true,
// //         id_type_infrastructure: true,
// //         name: true,
// //         description: true,
// //         existing_infrastructure: true,
// //         type: true,
// //         regionId: true, departementId: true, arrondissementId: true, communeId: true,
// //         domaineId: true, sousdomaineId: true,
// //         utilisateurId: true,
// //         location: true, images: true, attribus: true, composant: true,
// //         created_at: true, updated_at: true,
// //         ...(include?.includes('type') ? { typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } } } : {}),
// //         ...(include?.includes('territory') ? {
// //           region:        { select: { id: true, nom: true } },
// //           departement:   { select: { id: true, nom: true } },
// //           arrondissement:{ select: { id: true, nom: true } },
// //           commune:       { select: { id: true, nom: true } },
// //           competence:    { select: { id: true, name: true } },
// //         } : {}),
// //       },
// //     });
// //     if (!row) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

// //     return { ...row, id: toStrId(row.id) };
// //   }

// //   /* ---------- UPDATE ---------- */
// //   async update(idStr: string, dto: UpdateInfrastructureDto) {
// //     const id = BigInt(idStr);
// //     const current = await this.prisma.infrastructure.findUnique({
// //       where: { id },
// //       select: {
// //         id: true, id_type_infrastructure: true, name: true,
// //         regionId: true, departementId: true, arrondissementId: true, communeId: true,
// //         domaineId: true, sousdomaineId: true, utilisateurId: true,
// //         competenceId: true,
// //       },
// //     });
// //     if (!current) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

// //     const effTypeId = dto.typeId ?? current.id_type_infrastructure;
// //     await this.ensureTypeExists(effTypeId);

// //     const effRegion = dto.regionId ?? current.regionId;
// //     const effDep    = dto.departementId ?? current.departementId;
// //     const effArr    = dto.arrondissementId ?? current.arrondissementId;
// //     const effCom    = dto.communeId ?? current.communeId;
// //     await this.ensureTerritoryExists(effRegion, effDep, effArr, effCom);

// //     const effDom  = dto.domaineId ?? current.domaineId ?? undefined;
// //     const effSdom = dto.sousdomaineId ?? current.sousdomaineId ?? undefined;
// //         const effComp   = dto.competenceId ?? current.competenceId;

// //     await this.ensureClassification(effDom, effSdom,effComp);

// //     if (typeof dto.utilisateurId === 'number') {
// //       await this.ensureUserExists(dto.utilisateurId);
// //     }

// //     const folder = `infrastructures/${effCom}`;

// //     // Remplacement optionnel du JSON composant (indépendance) avec re-upload
// //     let newComposant: any[] | undefined = undefined;
// //     if (Array.isArray(dto.composant)) {
// //       newComposant = [];
// //       for (const c of dto.composant) {
// //         const imgs = await this.toCloudinaryUrls(ensureArray(c.images), `${folder}/components`);
// //         newComposant.push({
// //           ...c,
// //           type: (c.type ?? 'SIMPLE').toUpperCase(),
// //           location: ensureObject(c.location),
// //           images: imgs,
// //           attribus: ensureObject(c.attribus),
// //         });
// //       }
// //     }

// //     const data: any = {
// //       id_type_infrastructure: dto.typeId,
// //       name: dto.name,
// //       description: dto.description,
// //       existing_infrastructure: dto.existing_infrastructure,
// //       type: dto.type,
// //       regionId: dto.regionId,
// //       departementId: dto.departementId,
// //       arrondissementId: dto.arrondissementId,
// //       communeId: dto.communeId,
// //       domaineId: dto.domaineId,
// //       sousdomaineId: dto.sousdomaineId,
// //       utilisateurId: dto.utilisateurId, // ✅ modifiable si fourni
// //       competenceId: dto.competenceId ?? null,
// //       location: dto.location ? ensureObject(dto.location) : undefined,
// //       images: dto.images ? await this.toCloudinaryUrls(dto.images, folder) : undefined,
// //       attribus: dto.attribus ? ensureObject(dto.attribus) : undefined,
// //       composant: newComposant,
// //     };

// //     const updated = await this.prisma.infrastructure.update({
// //       where: { id }, data,
// //       select: {
// //         id: true, id_type_infrastructure: true, name: true, description: true, type: true,
// //         regionId: true, departementId: true, arrondissementId: true, communeId: true,
// //         domaineId: true, sousdomaineId: true, utilisateurId: true,
// //         location: true, images: true, attribus: true, composant: true, updated_at: true,
// //         competenceId: true,
// //       },
// //     });

// //     return { ...updated, id: toStrId(updated.id) };
// //   }

// //   /* ---------- DELETE ---------- */
// //   async remove(idStr: string) {
// //     const id = BigInt(idStr);
// //     const exists = await this.prisma.infrastructure.count({ where: { id } });
// //     if (!exists) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });
// //     await this.prisma.infrastructure.delete({ where: { id } });
// //   }

// //   /* ---------- EXPORT CSV ---------- */
// //   async exportCsv(params: Parameters<InfrastructuresService['list']>[0]) {
// //     const full = await this.list({ ...params, page: 1, pageSize: 100000, sort: params.sort });
// //     const headers = [
// //       'id','name','description','type','existing_infrastructure',
// //       'id_type_infrastructure',
// //       'regionId','departementId','arrondissementId','communeId',
// //       'domaineId','sousdomaineId','utilisateurId',
// //       'created_at','updated_at'
// //     ];
// //     const rows = full.items.map((r: any) => ([
// //       r.id, r.name, r.description ?? '', r.type, r.existing_infrastructure ? 1 : 0,
// //       r.id_type_infrastructure,
// //       r.regionId, r.departementId, r.arrondissementId, r.communeId,
// //       r.domaineId ?? '', r.sousdomaineId ?? '', r.utilisateurId ?? '',
// //       r.created_at?.toISOString?.() ?? '', r.updated_at?.toISOString?.() ?? ''
// //     ].map(v => (typeof v === 'string' && v.includes(',')) ? `"${v.replace(/"/g,'""')}"` : v).join(',')));
// //     return [headers.join(','), ...rows].join('\n');
// //   }

// //   /* ---------- BULK ---------- */
// //   async validateBulk(items: CreateInfrastructureDto[], defaultUserId?: number) {
// //     const errors: { index: number; message: string; messageE: string }[] = [];
// //     for (let i = 0; i < items.length; i++) {
// //       const it = items[i];
// //       try {
// //         await this.ensureTypeExists(it.typeId);
// //         await this.ensureTerritoryExists(it.regionId, it.departementId, it.arrondissementId, it.communeId);
// //         await this.ensureClassification(it.domaineId, it.sousdomaineId);
// //         // utilisateurId: si non fourni et defaultUserId présent, c’est OK. Sinon facultatif (schema nullable).
// //         if (typeof it.utilisateurId === 'number') {
// //           await this.ensureUserExists(it.utilisateurId);
// //         } else if (typeof defaultUserId === 'number') {
// //           await this.ensureUserExists(defaultUserId);
// //         }
// //         if (!it.name) throw new Error('name requis');
// //         if (!it.type) throw new Error('type requis');
// //         if (!it.location) throw new Error('location requis');
// //         if (!it.attribus) throw new Error('attribus requis');
// //       } catch (e: any) {
// //         errors.push({ index: i, message: `Ligne invalide: ${e.message ?? e}`, messageE: `Invalid row: ${e.message ?? e}` });
// //       }
// //     }
// //     return { valid: errors.length === 0, errors, count: items.length };
// //   }

// //   async bulk(items: CreateInfrastructureDto[], currentUserId?: number) {
// //     const result: { index: number; id?: string; error?: string }[] = [];
// //     for (let i = 0; i < items.length; i++) {
// //       try {
// //         const created = await this.create(items[i], currentUserId);
// //         result.push({ index: i, id: created.id });
// //       } catch (e: any) {
// //         result.push({ index: i, error: e?.message ?? 'unknown error' });
// //       }
// //     }
// //     return result;
// //   }

// //   /** 1) Résumé : total + par etat + par type */
// //   async statsSummary(q: Scope, req: any) {
// //     const where = applyUserCommune(buildWhere(q), req);

// //     const [total, simple, complexe] = await this.prisma.$transaction([
// //       this.prisma.infrastructure.count({ where }),
// //       this.prisma.infrastructure.count({ where: { ...where, type: 'SIMPLE' } }),
// //       this.prisma.infrastructure.count({ where: { ...where, type: 'COMPLEXE' } }),
// //     ]);

// //     // Par etat (attribus.etat) — normalisé en lower + filtré sur la liste
// //     const base = sqlWhereNumeric(where);
// //     const rows = await this.prisma.$queryRawUnsafe<Array<{ etat: string | null; c: any }>>(`
// //       SELECT LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat, COUNT(*) AS c
// //       FROM Infrastructure i
// //       ${base}
// //       GROUP BY etat
// //       ORDER BY c DESC;
// //     `);

// //     const byEtat = rows
// //       .filter(r => r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
// //       .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
// //       .sort((a,b) => b.count - a.count);

// //     return {
// //       message: 'Résumé des infrastructures.',
// //       messageE: 'Infrastructures summary.',
// //       data: {
// //         total,
// //         byType: { SIMPLE: simple, COMPLEXE: complexe },
// //         byEtat,
// //       },
// //     };
// //   }

// //   /** 2) Groupements (type|region|departement|commune) avec option etats */
// //   async statsGroup(
// //     q: Scope & { group: 'type'|'region'|'departement'|'commune'; include_etat?: boolean; limit?: number },
// //     req: any,
// //   ) {
// //     const where = applyUserCommune(buildWhere(q), req);
// //     const includeEtat = q.include_etat !== false;
// //     const limit = Number(q.limit ?? 50);

// //     const col =
// //       q.group === 'type'        ? 'id_type_infrastructure' :
// //       q.group === 'region'      ? 'regionId' :
// //       q.group === 'departement' ? 'departementId' :
// //                                   'communeId';

// //     const base = sqlWhereNumeric(where);

// //     const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
// //       SELECT ${col} AS k, COUNT(*) AS c
// //       FROM Infrastructure i
// //       ${base}
// //       GROUP BY ${col}
// //       ORDER BY c DESC;
// //     `);

// //     const ids = totals.map(t => t.k).filter((v): v is number => typeof v === 'number');

// //     // Libellés
// //     let names = new Map<number, string>();
// //     if (q.group === 'type' && ids.length) {
// //       const rows = await this.prisma.typeInfrastructure.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
// //       names = new Map(rows.map(r => [r.id, r.name]));
// //     } else if (q.group === 'region' && ids.length) {
// //       const rows = await this.prisma.region.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
// //       names = new Map(rows.map(r => [r.id, r.nom]));
// //     } else if (q.group === 'departement' && ids.length) {
// //       const rows = await this.prisma.departement.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
// //       names = new Map(rows.map(r => [r.id, r.nom]));
// //     } else if (q.group === 'commune' && ids.length) {
// //       const rows = await this.prisma.commune.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
// //       names = new Map(rows.map(r => [r.id, r.nom]));
// //     }

// //     let etatRows: Array<{ k: number | null; etat: string | null; c: any }> = [];
// //     if (includeEtat) {
// //       etatRows = await this.prisma.$queryRawUnsafe(`
// //         SELECT ${col} AS k,
// //                LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat,
// //                COUNT(*) AS c
// //         FROM Infrastructure i
// //         ${base}
// //         GROUP BY ${col}, etat;
// //       `);
// //     }

// //     const items = totals
// //       .filter(t => typeof t.k === 'number')
// //       .map(t => {
// //         const id = t.k as number;
// //         const count = Number(t.c);
// //         let etats: Array<{ etat: Etat; count: number }> | undefined;
// //         if (includeEtat) {
// //           etats = etatRows
// //             .filter(r => r.k === id && r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
// //             .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
// //             .sort((a,b) => b.count - a.count);
// //         }
// //         return { id, name: names.get(id), count, ...(includeEtat ? { etats } : {}) };
// //       })
// //       .sort((a,b) => b.count - a.count)
// //       .slice(0, limit);

// //     return {
// //       message: `Groupement par ${q.group}.`,
// //       messageE: `Grouping by ${q.group}.`,
// //       group: q.group,
// //       items,
// //     };
// //   }

// //   /** 3) Groupements par competenceId / domaineId (ordre décroissant) */
// //   async statsByDimension(
// //     dim: 'competence'|'domaine',
// //     q: Scope & { include_etat?: boolean; limit?: number },
// //     req: any,
// //   ) {
// //     const where = applyUserCommune(buildWhere(q), req);
// //     const includeEtat = q.include_etat !== false;
// //     const limit = Number(q.limit ?? 50);

// //     const col = dim === 'competence' ? 'competenceId' : 'domaineId';
// //     const base = sqlWhereNumeric(where);

// //     const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
// //       SELECT ${col} AS k, COUNT(*) AS c
// //       FROM Infrastructure i
// //       ${base}
// //       GROUP BY ${col}
// //       ORDER BY c DESC;
// //     `);

// //     const ids = totals.map(t => t.k).filter((v): v is number => typeof v === 'number');

// //     let names = new Map<number, string>();
// //     if (dim === 'competence' && ids.length) {
// //       const rows = await this.prisma.competence.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
// //       names = new Map(rows.map(r => [r.id, r.name]));
// //     } else if (dim === 'domaine' && ids.length) {
// //       const rows = await this.prisma.domaine.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
// //       names = new Map(rows.map(r => [r.id, r.nom]));
// //     }

// //     let etatRows: Array<{ k: number | null; etat: string | null; c: any }> = [];
// //     if (includeEtat) {
// //       etatRows = await this.prisma.$queryRawUnsafe(`
// //         SELECT ${col} AS k,
// //                LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat,
// //                COUNT(*) AS c
// //         FROM Infrastructure i
// //         ${base}
// //         GROUP BY ${col}, etat;
// //       `);
// //     }

// //     const items = totals
// //       .filter(t => typeof t.k === 'number')
// //       .map(t => {
// //         const id = t.k as number;
// //         const count = Number(t.c);
// //         let etats: Array<{ etat: Etat; count: number }> | undefined;
// //         if (includeEtat) {
// //           etats = etatRows
// //             .filter(r => r.k === id && r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
// //             .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
// //             .sort((a,b) => b.count - a.count);
// //         }
// //         return { id, name: names.get(id), count, ...(includeEtat ? { etats } : {}) };
// //       })
// //       .sort((a,b) => b.count - a.count)
// //       .slice(0, limit);

// //     return {
// //       message: `Groupement par ${dim}.`,
// //       messageE: `Grouping by ${dim}.`,
// //       group: dim,
// //       items,
// //     };
// //   }
// // }


// import { uploadImageToCloudinary } from './../utils/cloudinary';
// import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateInfrastructureDto } from './dto/create-infra.dto';
// import { UpdateInfrastructureDto } from './dto/update-infra.dto';

// type Order = Record<string, 'asc' | 'desc'>;

// /* ---------- helpers ---------- */
// function ensureObject(v: any) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
// function ensureArray<T = any>(v: any): T[] { return Array.isArray(v) ? v : []; }
// function toStrId(id: bigint | number | string): string {
//   if (typeof id === 'bigint') return id.toString();
//   if (typeof id === 'number') return String(id);
//   return id;
// }
// type Scope = {
//   regionId?: number;
//   departementId?: number;
//   arrondissementId?: number;
//   communeId?: number;
//   type?: 'SIMPLE'|'COMPLEXE';
//   typeId?: number;        // id_type_infrastructure
//   domaineId?: number;
//   sousdomaineId?: number;
//   competenceId?: number;
// };

// const ALLOWED_ETATS = ['excellent','bon','passable','mauvais','tres mauvais'] as const;
// type Etat = typeof ALLOWED_ETATS[number];

// function buildWhere(q: Scope) {
//   const where: any = {};
//   if (q.regionId)        where.regionId = Number(q.regionId);
//   if (q.departementId)   where.departementId = Number(q.departementId);
//   if (q.arrondissementId)where.arrondissementId = Number(q.arrondissementId);
//   if (q.communeId)       where.communeId = Number(q.communeId);
//   if (q.type)            where.type = q.type;
//   if (q.typeId)          where.id_type_infrastructure = Number(q.typeId);
//   if (q.domaineId)       where.domaineId = Number(q.domaineId);
//   if (q.sousdomaineId)   where.sousdomaineId = Number(q.sousdomaineId);
//   if (q.competenceId)    where.competenceId = Number(q.competenceId);
//   return where;
// }

// /** Clause WHERE SQL uniquement pour colonnes numériques whitelistées. */
// function sqlWhereNumeric(where: Record<string, any>) {
//   const allowed = [
//     'regionId','departementId','arrondissementId','communeId',
//     'id_type_infrastructure','domaineId','sousdomaineId','competenceId',
//   ];
//   const parts: string[] = [];
//   for (const [k,v] of Object.entries(where)) {
//     if (v === undefined || v === null) continue;
//     if (allowed.includes(k)) parts.push(`${k}=${Number(v)}`);
//   }
//   return parts.length ? 'WHERE '+parts.join(' AND ') : '';
// }

// /** Restreint le périmètre à la commune du user connecté si définie. */
// function applyUserCommune(where: any, req: any) {
//   const userCommuneId = req?.user?.communeId as number | undefined;
//   if (userCommuneId) {
//     // On force la commune et on retire d’éventuels filtres territoriaux plus larges
//     where.regionId = undefined;
//     where.departementId = undefined;
//     where.arrondissementId = undefined;
//     where.communeId = userCommuneId;
//   }
//   return where;
// }

// @Injectable()
// export class InfrastructuresService {
//   constructor(private readonly prisma: PrismaService) {}

//   /** Upload un tableau d’images : base64 -> Cloudinary, http -> conservé, autres -> ignoré */
//   private async toCloudinaryUrls(images: any[], folder: string): Promise<string[]> {
//     const src = Array.isArray(images) ? images : [];
//     const out: string[] = [];
//     for (const x of src) {
//       if (typeof x !== 'string') continue;
//       try {
//         if (/^data:(image\/.+|application\/pdf);base64,/.test(x)) {
//           out.push(await uploadImageToCloudinary(x, folder));
//         } else if (x.startsWith('http')) {
//           out.push(x);
//         }
//       } catch {
//         throw new BadRequestException({
//           message: `Image invalide ou upload échoué.`,
//           messageE: `Invalid image or upload failed.`,
//         });
//       }
//     }
//     return out;
//   }

//   /* ---------- validations FK ---------- */
//   private async ensureTypeExists(id: number) {
//     const ok = await this.prisma.typeInfrastructure.count({ where: { id } });
//     if (!ok) throw new BadRequestException({ message: 'TypeInfrastructure invalide.', messageE: 'Invalid TypeInfrastructure.' });
//   }

//   private async ensureTerritoryExists(regionId: number, departementId: number, arrondissementId: number, communeId: number) {
//     const [r, d, a, c] = await this.prisma.$transaction([
//       this.prisma.region.count({ where: { id: regionId } }),
//       this.prisma.departement.count({ where: { id: departementId } }),
//       this.prisma.arrondissement.count({ where: { id: arrondissementId } }),
//       this.prisma.commune.count({ where: { id: communeId } }),
//     ]);
//     if (!r || !d || !a || !c) {
//       throw new BadRequestException({
//         message: 'Territoire invalide (region/departement/arrondissement/commune).',
//         messageE: 'Invalid territory IDs.',
//       });
//     }
//   }

//   private async ensureClassification(domaineId?: number, sousdomaineId?: number, effComp?: number | null) {
//     if (typeof domaineId === 'number') {
//       const cnt = await this.prisma.domaine.count({ where: { id: domaineId } });
//       if (!cnt) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });
//     }
//     if (typeof sousdomaineId === 'number') {
//       const cnt = await this.prisma.sousDomaine.count({ where: { id: sousdomaineId } });
//       if (!cnt) throw new BadRequestException({ message: 'Sous-domaine invalide.', messageE: 'Invalid subdomain.' });
//     }
//   }

//   private async ensureUserExists(utilisateurId?: number) {
//     if (typeof utilisateurId !== 'number') return;
//     const cnt = await this.prisma.utilisateur.count({ where: { id: utilisateurId } });
//     if (!cnt) throw new BadRequestException({ message: 'Utilisateur (créateur) invalide.', messageE: 'Invalid user (creator).' });
//   }

//   /* ======================== Helpers récursifs pour CREATE ======================== */

//   /** Normalise récursivement un composant et uploade ses images une seule fois. */
//   private async normalizeComponentTree(component: any, folder: string): Promise<any> {
//     const c = ensureObject(component);
//     const out: any = {
//       ...c,
//       type: typeof c.type === 'string' ? c.type.toUpperCase() : (c.type ?? 'SIMPLE'),
//       location: ensureObject(c.location),
//       images: await this.toCloudinaryUrls(ensureArray(c.images), folder),
//       attribus: ensureObject(c.attribus),
//       composant: [],
//     };
//     for (const sub of ensureArray(c.composant)) {
//       out.composant.push(await this.normalizeComponentTree(sub, folder));
//     }
//     return out;
//   }

//   /** true/false pour existing flag en acceptant existingInfrastructure | existing_infrastructure */
//   private getExistingFlag(c: any): boolean {
//     const v = c?.existingInfrastructure ?? c?.existing_infrastructure;
//     return typeof v === 'boolean' ? v : true;
//   }

//   /**
//    * Crée un composant (et ses sous-composants) comme lignes `Infrastructure`,
//    * renvoie le JSON du composant enrichi avec l’`id` de la ligne créée
//    * et ses enfants enrichis (avec leurs ids).
//    */
//   private async createComponentRecursive(
//     tx: any,
//     ctx: {
//       rootName: string;
//       parentFolder: string;
//       creatorId: number | null;
//       typeId: number;
//       regionId: number;
//       departementId: number;
//       arrondissementId: number;
//       communeId: number;
//       domaineId: number | null;
//       sousdomaineId: number | null;
//       competenceId: number | null;
//     },
//     comp: any,
//     namePath: string[] = [],
//   ): Promise<any> {
//     const label = comp?.name ?? 'Composant';
//     const fullName = `${ctx.rootName} — ${[...namePath, label].join(' — ')}`;

//     // 1) crée la ligne enfant (composant actuel), composant=[] temporairement
//     const child = await tx.infrastructure.create({
//       data: {
//         id_type_infrastructure: ctx.typeId,
//         name: fullName,
//         description: comp?.description ?? null,
//         existing_infrastructure: this.getExistingFlag(comp),
//         type: (comp?.type ?? 'SIMPLE'),
//         regionId: ctx.regionId,
//         departementId: ctx.departementId,
//         arrondissementId: ctx.arrondissementId,
//         communeId: ctx.communeId,
//         domaineId: ctx.domaineId,
//         sousdomaineId: ctx.sousdomaineId,
//         competenceId: ctx.competenceId,
//         utilisateurId: ctx.creatorId,
//         location: ensureObject(comp?.location),
//         images: ensureArray(comp?.images),
//         attribus: ensureObject(comp?.attribus),
//         composant: [], // sous-composants seront injectés après
//       },
//       select: { id: true },
//     });

//     // 2) traite les sous-composants récursivement
//     const enrichedChildren: any[] = [];
//     for (const sub of ensureArray(comp?.composant)) {
//       const enriched = await this.createComponentRecursive(
//         tx, ctx, sub, [...namePath, label],
//       );
//       enrichedChildren.push(enriched);
//     }

//     // 3) met à jour la ligne enfant avec ses sous-composants enrichis (avec ids)
//     if (enrichedChildren.length) {
//       await tx.infrastructure.update({
//         where: { id: child.id },
//         data: { composant: enrichedChildren },
//         select: { id: true },
//       });
//     }

//     // 4) JSON de retour incluant l'id
//     return {
//       ...comp,
//       id: toStrId(child.id),
//       composant: enrichedChildren,
//     };
//   }

//   /* ---------- LIST ---------- */
//   async list(params: {
//     page: number; pageSize: number; sort?: Order;
//     regionId?: number; departementId?: number; arrondissementId?: number; communeId?: number;
//     typeId?: number; type?: string; q?: string; domaineId?: number; sousdomaineId?: number; utilisateurId?: number;
//     created_from?: string; created_to?: string; competenceId?: number;
//     req?: any; // pour le logging
//   }) {
//     const {
//       page, pageSize, sort,
//       regionId, departementId, arrondissementId, communeId,
//       typeId, type, q, domaineId, sousdomaineId, utilisateurId, created_from, created_to,competenceId, req
//     } = params;
//     const currentUserId = req?.sub as number | undefined;
//     const userCommuneId = req?.user.communeId as number | undefined;

//     const where: any = {};
//     if (typeof regionId === 'number') where.regionId = regionId;
//     if (typeof departementId === 'number') where.departementId = departementId;
//     if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
//     if (typeof communeId === 'number') where.communeId = communeId;
//     if (typeof utilisateurId === 'number') where.utilisateurId = utilisateurId;
//     if (typeof competenceId === 'number') where.competenceId = competenceId;

//     if (currentUserId && userCommuneId) {
//       where.communeId = userCommuneId; // Limite aux infrastructures de la commune de l'utilisateur
//     }

//     if (typeof typeId === 'number') where.id_type_infrastructure = typeId;
//     if (typeof domaineId === 'number') where.domaineId = domaineId;
//     if (typeof sousdomaineId === 'number') where.sousdomaineId = sousdomaineId;
//     if (type) where.type = type;
//     if (q) {
//       where.OR = [
//         { name:        { contains: q, mode: 'insensitive' } },
//         { description: { contains: q, mode: 'insensitive' } },
//       ];
//     }
//     if (created_from || created_to) {
//       where.created_at = {};
//       if (created_from) where.created_at.gte = new Date(created_from + 'T00:00:00Z');
//       if (created_to)   where.created_at.lte = new Date(created_to   + 'T23:59:59Z');
//     }

//     const [total, rows] = await this.prisma.$transaction([
//       this.prisma.infrastructure.count({ where }),
//       this.prisma.infrastructure.findMany({
//         where,
//         orderBy: sort ?? { created_at: 'desc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true,
//           id_type_infrastructure: true,
//           typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } },
//           name: true,
//           description: true,
//           existing_infrastructure: true,
//           type: true,
//           regionId: true, region: true, departementId: true, departement: true, arrondissementId: true, arrondissement: true, communeId: true, commune: true,
//           domaineId: true, domaine: { select: { id: true, nom: true, code: true } }, sousdomaineId: true, sousdomaine: { select: { id: true, nom: true, code: true } },
//           location: true, images: true, attribus: true, composant: true, competenceId: true, competence: { select: { id: true, name: true } },
//           created_at: true, updated_at: true,
//         },
//       }),
//     ]);

//     const items = rows.map(r => ({ ...r, id: toStrId(r.id), name_type_infrastructure: r.typeRef.name }));
//     return { total, items };
//   }

//   /* ---------- CREATE (récursif, Cloudinary, duplication enfants indépendants + ids injectés) ---------- */
//   async create(dto: CreateInfrastructureDto, currentUserId?: number) {
//     await this.ensureTypeExists(dto.typeId);
//     await this.ensureTerritoryExists(dto.regionId, dto.departementId, dto.arrondissementId, dto.communeId);
//     await this.ensureClassification(dto.domaineId, dto.sousdomaineId);

//     // Choix du créateur: dto.utilisateurId > currentUserId > null
//     const creatorId = dto.utilisateurId ?? currentUserId ?? null;
//     await this.ensureUserExists(creatorId ?? undefined);

//     const parentFolder = `infrastructures/${dto.communeId}`;

//     // 1) normalise les composants (toutes profondeurs) + upload images
//     const normalizedComponents: any[] = [];
//     for (const c of ensureArray(dto.composant)) {
//       normalizedComponents.push(await this.normalizeComponentTree(c, `${parentFolder}/components`));
//     }

//     // 2) payload parent (composant: [] temporairement — on réinjecte après avec ids)
//     const dataParent: any = {
//       id_type_infrastructure: dto.typeId,
//       name: dto.name,
//       description: dto.description ?? null,
//       existing_infrastructure: dto.existing_infrastructure ?? true,
//       type: dto.type, // SIMPLE|COMPLEXE (upper par DTO)
//       regionId: dto.regionId,
//       departementId: dto.departementId,
//       competenceId: dto.competenceId ?? null,
//       arrondissementId: dto.arrondissementId,
//       communeId: dto.communeId,
//       domaineId: dto.domaineId ?? null,
//       sousdomaineId: dto.sousdomaineId ?? null,
//       utilisateurId: creatorId,            // ✅ trace du créateur
//       location: ensureObject(dto.location),
//       images: await this.toCloudinaryUrls(ensureArray(dto.images), parentFolder),
//       attribus: ensureObject(dto.attribus),
//       composant: [],                       // ← injecté après avec ids
//     };

//     // 3) transaction : parent -> enfants récursifs -> update parent
//     const result = await this.prisma.$transaction(async (tx) => {
//       // 3.1) crée le parent
//       const parent = await tx.infrastructure.create({
//         data: dataParent,
//         select: { id: true },
//       });

//       const ctx = {
//         rootName: dto.name,
//         parentFolder,
//         creatorId,
//         typeId: dto.typeId,
//         regionId: dto.regionId,
//         departementId: dto.departementId,
//         arrondissementId: dto.arrondissementId,
//         communeId: dto.communeId,
//         domaineId: dto.domaineId ?? null,
//         sousdomaineId: dto.sousdomaineId ?? null,
//         competenceId: dto.competenceId ?? null,
//       };

//       // 3.2) crée tous les composants (et sous-composants) récursivement
//       const enrichedComponents: any[] = [];
//       for (const comp of normalizedComponents) {
//         const enriched = await this.createComponentRecursive(tx, ctx, comp, []);
//         enrichedComponents.push(enriched);
//       }

//       // 3.3) update du parent : injecter la version enrichie des composants (avec ids)
//       if (enrichedComponents.length) {
//         await tx.infrastructure.update({
//           where: { id: parent.id },
//           data: { composant: enrichedComponents },
//           select: { id: true },
//         });
//       }

//       return { id: toStrId(parent.id), composants: enrichedComponents };
//     });

//     return result;
//   }

//   /* ---------- GET ONE ---------- */
//   async findOne(idStr: string, include?: string[]) {
//     const id = BigInt(idStr);
//     const row = await this.prisma.infrastructure.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         id_type_infrastructure: true,
//         name: true,
//         description: true,
//         existing_infrastructure: true,
//         type: true,
//         regionId: true, departementId: true, arrondissementId: true, communeId: true,
//         domaineId: true, sousdomaineId: true,
//         utilisateurId: true,
//         location: true, images: true, attribus: true, composant: true,
//         created_at: true, updated_at: true,
//         ...(include?.includes('type') ? { typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } } } : {}),
//         ...(include?.includes('territory') ? {
//           region:        { select: { id: true, nom: true } },
//           departement:   { select: { id: true, nom: true } },
//           arrondissement:{ select: { id: true, nom: true } },
//           commune:       { select: { id: true, nom: true } },
//           competence:    { select: { id: true, name: true } },
//         } : {}),
//       },
//     });
//     if (!row) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

//     return { ...row, id: toStrId(row.id) };
//   }

//   /* ---------- UPDATE ---------- */
//   async update(idStr: string, dto: UpdateInfrastructureDto) {
//     const id = BigInt(idStr);
//     const current = await this.prisma.infrastructure.findUnique({
//       where: { id },
//       select: {
//         id: true, id_type_infrastructure: true, name: true,
//         regionId: true, departementId: true, arrondissementId: true, communeId: true,
//         domaineId: true, sousdomaineId: true, utilisateurId: true,
//         competenceId: true,
//       },
//     });
//     if (!current) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

//     const effTypeId = dto.typeId ?? current.id_type_infrastructure;
//     await this.ensureTypeExists(effTypeId);

//     const effRegion = dto.regionId ?? current.regionId;
//     const effDep    = dto.departementId ?? current.departementId;
//     const effArr    = dto.arrondissementId ?? current.arrondissementId;
//     const effCom    = dto.communeId ?? current.communeId;
//     await this.ensureTerritoryExists(effRegion, effDep, effArr, effCom);

//     const effDom  = dto.domaineId ?? current.domaineId ?? undefined;
//     const effSdom = dto.sousdomaineId ?? current.sousdomaineId ?? undefined;
//     const effComp = dto.competenceId ?? current.competenceId;
//     await this.ensureClassification(effDom, effSdom, effComp);

//     if (typeof dto.utilisateurId === 'number') {
//       await this.ensureUserExists(dto.utilisateurId);
//     }

//     const folder = `infrastructures/${effCom}`;

//     // Remplacement optionnel du JSON composant (indépendance) avec re-upload (pas de création de lignes)
//     let newComposant: any[] | undefined = undefined;
//     if (Array.isArray(dto.composant)) {
//       newComposant = [];
//       for (const c of dto.composant) {
//         const imgs = await this.toCloudinaryUrls(ensureArray(c.images), `${folder}/components`);
//         newComposant.push({
//           ...c,
//           type: (c.type ?? 'SIMPLE').toUpperCase(),
//           location: ensureObject(c.location),
//           images: imgs,
//           attribus: ensureObject(c.attribus),
//         });
//       }
//     }

//     const data: any = {
//       id_type_infrastructure: dto.typeId,
//       name: dto.name,
//       description: dto.description,
//       existing_infrastructure: dto.existing_infrastructure,
//       type: dto.type,
//       regionId: dto.regionId,
//       departementId: dto.departementId,
//       arrondissementId: dto.arrondissementId,
//       communeId: dto.communeId,
//       domaineId: dto.domaineId,
//       sousdomaineId: dto.sousdomaineId,
//       utilisateurId: dto.utilisateurId,
//       competenceId: dto.competenceId ?? null,
//       location: dto.location ? ensureObject(dto.location) : undefined,
//       images: dto.images ? await this.toCloudinaryUrls(ensureArray(dto.images), folder) : undefined,
//       attribus: dto.attribus ? ensureObject(dto.attribus) : undefined,
//       composant: newComposant,
//     };

//     const updated = await this.prisma.infrastructure.update({
//       where: { id }, data,
//       select: {
//         id: true, id_type_infrastructure: true, name: true, description: true, type: true,
//         regionId: true, departementId: true, arrondissementId: true, communeId: true,
//         domaineId: true, sousdomaineId: true, utilisateurId: true,
//         location: true, images: true, attribus: true, composant: true, updated_at: true,
//         competenceId: true,
//       },
//     });

//     return { ...updated, id: toStrId(updated.id) };
//   }

//   /* ---------- DELETE ---------- */
//   async remove(idStr: string) {
//     const id = BigInt(idStr);
//     const exists = await this.prisma.infrastructure.count({ where: { id } });
//     if (!exists) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });
//     await this.prisma.infrastructure.delete({ where: { id } });
//   }

//   /* ---------- EXPORT CSV ---------- */
//   async exportCsv(params: Parameters<InfrastructuresService['list']>[0]) {
//     const full = await this.list({ ...params, page: 1, pageSize: 100000, sort: params.sort });
//     const headers = [
//       'id','name','description','type','existing_infrastructure',
//       'id_type_infrastructure',
//       'regionId','departementId','arrondissementId','communeId',
//       'domaineId','sousdomaineId','utilisateurId',
//       'created_at','updated_at'
//     ];
//     const rows = full.items.map((r: any) => ([
//       r.id, r.name, r.description ?? '', r.type, r.existing_infrastructure ? 1 : 0,
//       r.id_type_infrastructure,
//       r.regionId, r.departementId, r.arrondissementId, r.communeId,
//       r.domaineId ?? '', r.sousdomaineId ?? '', r.utilisateurId ?? '',
//       r.created_at?.toISOString?.() ?? '', r.updated_at?.toISOString?.() ?? ''
//     ].map(v => (typeof v === 'string' && v.includes(',')) ? `"${v.replace(/"/g,'""')}"` : v).join(',')));
//     return [headers.join(','), ...rows].join('\n');
//   }

//   /* ---------- BULK ---------- */
//   async validateBulk(items: CreateInfrastructureDto[], defaultUserId?: number) {
//     const errors: { index: number; message: string; messageE: string }[] = [];
//     for (let i = 0; i < items.length; i++) {
//       const it = items[i];
//       try {
//         await this.ensureTypeExists(it.typeId);
//         await this.ensureTerritoryExists(it.regionId, it.departementId, it.arrondissementId, it.communeId);
//         await this.ensureClassification(it.domaineId, it.sousdomaineId);
//         if (typeof it.utilisateurId === 'number') {
//           await this.ensureUserExists(it.utilisateurId);
//         } else if (typeof defaultUserId === 'number') {
//           await this.ensureUserExists(defaultUserId);
//         }
//         if (!it.name) throw new Error('name requis');
//         if (!it.type) throw new Error('type requis');
//         if (!it.location) throw new Error('location requis');
//         if (!it.attribus) throw new Error('attribus requis');
//       } catch (e: any) {
//         errors.push({ index: i, message: `Ligne invalide: ${e.message ?? e}`, messageE: `Invalid row: ${e.message ?? e}` });
//       }
//     }
//     return { valid: errors.length === 0, errors, count: items.length };
//   }

//   async bulk(items: CreateInfrastructureDto[], currentUserId?: number) {
//     const result: { index: number; id?: string; error?: string }[] = [];
//     for (let i = 0; i < items.length; i++) {
//       try {
//         const created = await this.create(items[i], currentUserId);
//         result.push({ index: i, id: created.id });
//       } catch (e: any) {
//         result.push({ index: i, error: e?.message ?? 'unknown error' });
//       }
//     }
//     return result;
//   }

//   /** 1) Résumé : total + par etat + par type */
//   async statsSummary(q: Scope, req: any) {
//     const where = applyUserCommune(buildWhere(q), req);

//     const [total, simple, complexe] = await this.prisma.$transaction([
//       this.prisma.infrastructure.count({ where }),
//       this.prisma.infrastructure.count({ where: { ...where, type: 'SIMPLE' } }),
//       this.prisma.infrastructure.count({ where: { ...where, type: 'COMPLEXE' } }),
//     ]);

//     const base = sqlWhereNumeric(where);
//     const rows = await this.prisma.$queryRawUnsafe<Array<{ etat: string | null; c: any }>>(`
//       SELECT LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat, COUNT(*) AS c
//       FROM Infrastructure i
//       ${base}
//       GROUP BY etat
//       ORDER BY c DESC;
//     `);

//     const byEtat = rows
//       .filter(r => r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
//       .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
//       .sort((a,b) => b.count - a.count);

//     return {
//       message: 'Résumé des infrastructures.',
//       messageE: 'Infrastructures summary.',
//       data: {
//         total,
//         byType: { SIMPLE: simple, COMPLEXE: complexe },
//         byEtat,
//       },
//     };
//   }

//   /** 2) Groupements (type|region|departement|commune) avec option etats */
//   async statsGroup(
//     q: Scope & { group: 'type'|'region'|'departement'|'commune'; include_etat?: boolean; limit?: number },
//     req: any,
//   ) {
//     const where = applyUserCommune(buildWhere(q), req);
//     const includeEtat = q.include_etat !== false;
//     const limit = Number(q.limit ?? 50);

//     const col =
//       q.group === 'type'        ? 'id_type_infrastructure' :
//       q.group === 'region'      ? 'regionId' :
//       q.group === 'departement' ? 'departementId' :
//                                   'communeId';

//     const base = sqlWhereNumeric(where);

//     const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
//       SELECT ${col} AS k, COUNT(*) AS c
//       FROM Infrastructure i
//       ${base}
//       GROUP BY ${col}
//       ORDER BY c DESC;
//     `);

//     const ids = totals.map(t => t.k).filter((v): v is number => typeof v === 'number');

//     // Libellés
//     let names = new Map<number, string>();
//     if (q.group === 'type' && ids.length) {
//       const rows = await this.prisma.typeInfrastructure.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
//       names = new Map(rows.map(r => [r.id, r.name]));
//     } else if (q.group === 'region' && ids.length) {
//       const rows = await this.prisma.region.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
//       names = new Map(rows.map(r => [r.id, r.nom]));
//     } else if (q.group === 'departement' && ids.length) {
//       const rows = await this.prisma.departement.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
//       names = new Map(rows.map(r => [r.id, r.nom]));
//     } else if (q.group === 'commune' && ids.length) {
//       const rows = await this.prisma.commune.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
//       names = new Map(rows.map(r => [r.id, r.nom]));
//     }

//     let etatRows: Array<{ k: number | null; etat: string | null; c: any }> = [];
//     if (includeEtat) {
//       etatRows = await this.prisma.$queryRawUnsafe(`
//         SELECT ${col} AS k,
//                LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat,
//                COUNT(*) AS c
//         FROM Infrastructure i
//         ${base}
//         GROUP BY ${col}, etat;
//       `);
//     }

//     const items = totals
//       .filter(t => typeof t.k === 'number')
//       .map(t => {
//         const id = t.k as number;
//         const count = Number(t.c);
//         let etats: Array<{ etat: Etat; count: number }> | undefined;
//         if (includeEtat) {
//           etats = etatRows
//             .filter(r => r.k === id && r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
//             .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
//             .sort((a,b) => b.count - a.count);
//         }
//         return { id, name: names.get(id), count, ...(includeEtat ? { etats } : {}) };
//       })
//       .sort((a,b) => b.count - a.count)
//       .slice(0, limit);

//     return {
//       message: `Groupement par ${q.group}.`,
//       messageE: `Grouping by ${q.group}.`,
//       group: q.group,
//       items,
//     };
//   }

//   /** 3) Groupements par competenceId / domaineId (ordre décroissant) */
//   async statsByDimension(
//     dim: 'competence'|'domaine',
//     q: Scope & { include_etat?: boolean; limit?: number },
//     req: any,
//   ) {
//     const where = applyUserCommune(buildWhere(q), req);
//     const includeEtat = q.include_etat !== false;
//     const limit = Number(q.limit ?? 50);

//     const col = dim === 'competence' ? 'competenceId' : 'domaineId';
//     const base = sqlWhereNumeric(where);

//     const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
//       SELECT ${col} AS k, COUNT(*) AS c
//       FROM Infrastructure i
//       ${base}
//       GROUP BY ${col}
//       ORDER BY c DESC;
//     `);

//     const ids = totals.map(t => t.k).filter((v): v is number => typeof v === 'number');

//     let names = new Map<number, string>();
//     if (dim === 'competence' && ids.length) {
//       const rows = await this.prisma.competence.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
//       names = new Map(rows.map(r => [r.id, r.name]));
//     } else if (dim === 'domaine' && ids.length) {
//       const rows = await this.prisma.domaine.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
//       names = new Map(rows.map(r => [r.id, r.nom]));
//     }

//     let etatRows: Array<{ k: number | null; etat: string | null; c: any }> = [];
//     if (includeEtat) {
//       etatRows = await this.prisma.$queryRawUnsafe(`
//         SELECT ${col} AS k,
//                LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat,
//                COUNT(*) AS c
//         FROM Infrastructure i
//         ${base}
//         GROUP BY ${col}, etat;
//       `);
//     }

//     const items = totals
//       .filter(t => typeof t.k === 'number')
//       .map(t => {
//         const id = t.k as number;
//         const count = Number(t.c);
//         let etats: Array<{ etat: Etat; count: number }> | undefined;
//         if (includeEtat) {
//           etats = etatRows
//             .filter(r => r.k === id && r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
//             .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
//             .sort((a,b) => b.count - a.count);
//         }
//         return { id, name: names.get(id), count, ...(includeEtat ? { etats } : {}) };
//       })
//       .sort((a,b) => b.count - a.count)
//       .slice(0, limit);

//     return {
//       message: `Groupement par ${dim}.`,
//       messageE: `Grouping by ${dim}.`,
//       group: dim,
//       items,
//     };
//   }
// }


import { uploadImageToCloudinary } from './../utils/cloudinary';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInfrastructureDto } from './dto/create-infra.dto';
import { UpdateInfrastructureDto } from './dto/update-infra.dto';

type Order = Record<string, 'asc' | 'desc'>;

/* ---------- helpers ---------- */
function ensureObject(v: any) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function ensureArray<T = any>(v: any): T[] { return Array.isArray(v) ? v : []; }
function toStrId(id: bigint | number | string): string {
  if (typeof id === 'bigint') return id.toString();
  if (typeof id === 'number') return String(id);
  return id;
}
type Scope = {
  regionId?: number;
  departementId?: number;
  arrondissementId?: number;
  communeId?: number;
  type?: 'SIMPLE'|'COMPLEXE';
  typeId?: number;        // id_type_infrastructure
  domaineId?: number;
  sousdomaineId?: number;
  competenceId?: number;
};

const ALLOWED_ETATS = ['excellent','bon','passable','mauvais','tres mauvais'] as const;
type Etat = typeof ALLOWED_ETATS[number];

function buildWhere(q: Scope) {
  const where: any = {};
  if (q.regionId)        where.regionId = Number(q.regionId);
  if (q.departementId)   where.departementId = Number(q.departementId);
  if (q.arrondissementId)where.arrondissementId = Number(q.arrondissementId);
  if (q.communeId)       where.communeId = Number(q.communeId);
  if (q.type)            where.type = q.type;
  if (q.typeId)          where.id_type_infrastructure = Number(q.typeId);
  if (q.domaineId)       where.domaineId = Number(q.domaineId);
  if (q.sousdomaineId)   where.sousdomaineId = Number(q.sousdomaineId);
  if (q.competenceId)    where.competenceId = Number(q.competenceId);
  return where;
}

/** Clause WHERE SQL uniquement pour colonnes numériques whitelistées. */
function sqlWhereNumeric(where: Record<string, any>) {
  const allowed = [
    'regionId','departementId','arrondissementId','communeId',
    'id_type_infrastructure','domaineId','sousdomaineId','competenceId',
  ];
  const parts: string[] = [];
  for (const [k,v] of Object.entries(where)) {
    if (v === undefined || v === null) continue;
    if (allowed.includes(k)) parts.push(`${k}=${Number(v)}`);
  }
  return parts.length ? 'WHERE '+parts.join(' AND ') : '';
}

/** Restreint le périmètre à la commune du user connecté si définie. */
function applyUserCommune(where: any, req: any) {
  const userCommuneId = req?.user?.communeId as number | undefined;
  if (userCommuneId) {
    where.regionId = undefined;
    where.departementId = undefined;
    where.arrondissementId = undefined;
    where.communeId = userCommuneId;
  }
  return where;
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

  private async ensureClassification(domaineId?: number, sousdomaineId?: number, effComp?: number | null) {
    if (typeof domaineId === 'number') {
      const cnt = await this.prisma.domaine.count({ where: { id: domaineId } });
      if (!cnt) throw new BadRequestException({ message: 'Domaine invalide.', messageE: 'Invalid domain.' });
    }
    if (typeof sousdomaineId === 'number') {
      const cnt = await this.prisma.sousDomaine.count({ where: { id: sousdomaineId } });
      if (!cnt) throw new BadRequestException({ message: 'Sous-domaine invalide.', messageE: 'Invalid subdomain.' });
    }
  }

  private async ensureUserExists(utilisateurId?: number) {
    if (typeof utilisateurId !== 'number') return;
    const cnt = await this.prisma.utilisateur.count({ where: { id: utilisateurId } });
    if (!cnt) throw new BadRequestException({ message: 'Utilisateur (créateur) invalide.', messageE: 'Invalid user (creator).' });
  }

  /* ======================== Helpers récursifs pour CREATE ======================== */

  /** Normalise récursivement un composant et uploade ses images une seule fois. */
  private async normalizeComponentTree(component: any, folder: string): Promise<any> {
    const c = ensureObject(component);
    const out: any = {
      ...c,
      type: typeof c.type === 'string' ? c.type.toUpperCase() : (c.type ?? 'SIMPLE'),
      location: ensureObject(c.location),
      images: await this.toCloudinaryUrls(ensureArray(c.images), folder),
      attribus: ensureObject(c.attribus),
      composant: [],
    };
    for (const sub of ensureArray(c.composant)) {
      out.composant.push(await this.normalizeComponentTree(sub, folder));
    }
    return out;
  }

  /** Renvoie un booléen pour existing flag (existingInfrastructure | existing_infrastructure) */
  private getExistingFlag(c: any): boolean {
    const v = c?.existingInfrastructure ?? c?.existing_infrastructure;
    return typeof v === 'boolean' ? v : true;
  }

  /**
   * Crée un composant (et sous-composants) comme lignes `Infrastructure`, relie via `id_parent`,
   * et renvoie le JSON du composant enrichi avec l’`id` créé et ses enfants enrichis.
   */
  private async createComponentRecursive(
    tx: any,
    ctx: {
      creatorId: number | null;
      typeId: number;
      regionId: number;
      departementId: number;
      arrondissementId: number;
      communeId: number;
      domaineId: number | null;
      sousdomaineId: number | null;
      competenceId: number | null;
    },
    comp: any,
    parentId: bigint,
  ): Promise<any> {
    const name = comp?.name ?? 'Composant';

    // 1) crée la ligne enfant avec lien parent
    const child = await tx.infrastructure.create({
      data: {
        id_parent: parentId, // 👈 lien hiérarchique
        id_type_infrastructure: ctx.typeId,
        name,
        description: comp?.description ?? null,
        existing_infrastructure: this.getExistingFlag(comp),
        type: (comp?.type ?? 'SIMPLE'),
        regionId: ctx.regionId,
        departementId: ctx.departementId,
        arrondissementId: ctx.arrondissementId,
        communeId: ctx.communeId,
        domaineId: ctx.domaineId,
        sousdomaineId: ctx.sousdomaineId,
        competenceId: ctx.competenceId,
        utilisateurId: ctx.creatorId,
        location: ensureObject(comp?.location),
        images: ensureArray(comp?.images),
        attribus: ensureObject(comp?.attribus),
        composant: [],
      },
      select: { id: true },
    });

    // 2) sous-composants récursifs
    const enrichedChildren: any[] = [];
    for (const sub of ensureArray(comp?.composant)) {
      const enriched = await this.createComponentRecursive(tx, ctx, sub, child.id);
      enrichedChildren.push(enriched);
    }

    // 3) met à jour la ligne enfant avec ses sous-composants enrichis
    if (enrichedChildren.length) {
      await tx.infrastructure.update({
        where: { id: child.id },
        data: { composant: enrichedChildren },
        select: { id: true },
      });
    }

    // 4) JSON retourné
    return {
      ...comp,
      id: toStrId(child.id),
      composant: enrichedChildren,
    };
  }

  /* ---------- LIST ---------- */
  async list(params: {
    page: number; pageSize: number; sort?: Order;
    regionId?: number; departementId?: number; arrondissementId?: number; communeId?: number;
    typeId?: number; type?: string; q?: string; domaineId?: number; sousdomaineId?: number; utilisateurId?: number;
    created_from?: string; created_to?: string; competenceId?: number;
    req?: any;
  }) {
    const {
      page, pageSize, sort,
      regionId, departementId, arrondissementId, communeId,
      typeId, type, q, domaineId, sousdomaineId, utilisateurId, created_from, created_to, competenceId, req
    } = params;
    const currentUserId = req?.sub as number | undefined;
    const userCommuneId = req?.user?.communeId as number | undefined;

    const where: any = {
       id_parent: null, 
    };
    if (typeof regionId === 'number') where.regionId = regionId;
    if (typeof departementId === 'number') where.departementId = departementId;
    if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
    if (typeof communeId === 'number') where.communeId = communeId;
    if (typeof utilisateurId === 'number') where.utilisateurId = utilisateurId;
    if (typeof competenceId === 'number') where.competenceId = competenceId;

    if (currentUserId && userCommuneId) {
      where.communeId = userCommuneId; // Limite aux infrastructures de la commune de l'utilisateur
    }

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
          id_parent: true, // 👈
          id_type_infrastructure: true,
          typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } },
          name: true,
          description: true,
          existing_infrastructure: true,
          type: true,
          regionId: true, region: true,
          departementId: true, departement: true,
          arrondissementId: true, arrondissement: true,
          communeId: true, commune: true,
          domaineId: true, domaine: { select: { id: true, nom: true, code: true } },
          sousdomaineId: true, sousdomaine: { select: { id: true, nom: true, code: true } },
          competenceId: true, competence: { select: { id: true, name: true } },
          location: true, images: true, attribus: true, composant: true,
          created_at: true, updated_at: true,
        },
      }),
    ]);

    const items = rows.map(r => ({
      ...r,
      id: toStrId(r.id),
      id_parent: r.id_parent ? toStrId(r.id_parent as any) : null,
      name_type_infrastructure: r.typeRef.name,
    }));
    return { total, items };
  }

  /* ---------- CREATE (récursif avec id_parent) ---------- */
  async create(dto: CreateInfrastructureDto, currentUserId?: number) {
    await this.ensureTypeExists(dto.typeId);
    await this.ensureTerritoryExists(dto.regionId, dto.departementId, dto.arrondissementId, dto.communeId);
    await this.ensureClassification(dto.domaineId, dto.sousdomaineId);

    // Choix du créateur: dto.utilisateurId > currentUserId > null
    const creatorId = dto.utilisateurId ?? currentUserId ?? null;
    await this.ensureUserExists(creatorId ?? undefined);

    const parentFolder = `infrastructures/${dto.communeId}`;

    // 1) normalise les composants (toutes profondeurs) + upload images
    const normalizedComponents: any[] = [];
    for (const c of ensureArray(dto.composant)) {
      normalizedComponents.push(await this.normalizeComponentTree(c, `${parentFolder}/components`));
    }

    // 2) payload parent (id_parent: null)
    const dataParent: any = {
      id_parent: null,                    // 👈 parent racine
      id_type_infrastructure: dto.typeId,
      name: dto.name,
      description: dto.description ?? null,
      existing_infrastructure: dto.existing_infrastructure ?? true,
      type: (dto.type ?? 'SIMPLE'),       // assume DTO valide déjà
      regionId: dto.regionId,
      departementId: dto.departementId,
      arrondissementId: dto.arrondissementId,
      communeId: dto.communeId,
      domaineId: dto.domaineId ?? null,
      sousdomaineId: dto.sousdomaineId ?? null,
      competenceId: dto.competenceId ?? null,
      utilisateurId: creatorId,
      location: ensureObject(dto.location),
      images: await this.toCloudinaryUrls(ensureArray(dto.images), parentFolder),
      attribus: ensureObject(dto.attribus),
      composant: [],                      // injecté après avec ids enfants
    };

    // 3) transaction : parent -> enfants récursifs -> update parent
    const result = await this.prisma.$transaction(async (tx) => {
      // 3.1) crée le parent
      const parent = await tx.infrastructure.create({
        data: dataParent,
        select: { id: true },
      });

      const ctx = {
        creatorId,
        typeId: dto.typeId,
        regionId: dto.regionId,
        departementId: dto.departementId,
        arrondissementId: dto.arrondissementId,
        communeId: dto.communeId,
        domaineId: dto.domaineId ?? null,
        sousdomaineId: dto.sousdomaineId ?? null,
        competenceId: dto.competenceId ?? null,
      };

      // 3.2) crée tous les composants (et sous-composants) récursivement
      const enrichedComponents: any[] = [];
      for (const comp of normalizedComponents) {
        const enriched = await this.createComponentRecursive(tx, ctx, comp, parent.id);
        enrichedComponents.push(enriched);
      }

      // 3.3) update du parent : injecter la version enrichie des composants (avec ids)
      if (enrichedComponents.length) {
        await tx.infrastructure.update({
          where: { id: parent.id },
          data: { composant: enrichedComponents },
          select: { id: true },
        });
      }

      return { id: toStrId(parent.id), composants: enrichedComponents };
    });

    return result;
  }

  /* ---------- GET ONE ---------- */
  async findOne(idStr: string, include?: string[]) {
    const id = BigInt(idStr);
    const row = await this.prisma.infrastructure.findUnique({
      where: { id },
      select: {
        id: true,
        id_parent: true, // 👈
        id_type_infrastructure: true,
        name: true,
        description: true,
        existing_infrastructure: true,
        type: true,
        regionId: true, departementId: true, arrondissementId: true, communeId: true,
        domaineId: true, sousdomaineId: true,
        utilisateurId: true, competenceId: true,
        location: true, images: true, attribus: true, composant: true,
        created_at: true, updated_at: true,
        ...(include?.includes('type') ? { typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } } } : {}),
        ...(include?.includes('territory') ? {
          region:        { select: { id: true, nom: true } },
          departement:   { select: { id: true, nom: true } },
          arrondissement:{ select: { id: true, nom: true } },
          commune:       { select: { id: true, nom: true } },
          competence:    { select: { id: true, name: true } },
        } : {}),
      },
    });
    if (!row) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

    return { ...row, id: toStrId(row.id), id_parent: row.id_parent ? toStrId(row.id_parent as any) : null };
  }

  /* ---------- UPDATE ---------- */
  async update(idStr: string, dto: UpdateInfrastructureDto) {
    const id = BigInt(idStr);
    const current = await this.prisma.infrastructure.findUnique({
      where: { id },
      select: {
        id: true, id_parent: true,
        id_type_infrastructure: true, name: true,
        regionId: true, departementId: true, arrondissementId: true, communeId: true,
        domaineId: true, sousdomaineId: true, utilisateurId: true, competenceId: true,
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
    const effComp = dto.competenceId ?? current.competenceId;
    await this.ensureClassification(effDom, effSdom, effComp);

    if (typeof dto.utilisateurId === 'number') {
      await this.ensureUserExists(dto.utilisateurId);
    }

    const folder = `infrastructures/${effCom}`;

    // Remplacement optionnel du JSON composant (indépendant) avec re-upload (pas de création de lignes)
    let newComposant: any[] | undefined = undefined;
    if (Array.isArray(dto.composant)) {
      newComposant = [];
      for (const c of dto.composant) {
        const imgs = await this.toCloudinaryUrls(ensureArray(c.images), `${folder}/components`);
        newComposant.push({
          ...c,
          type: (c.type ?? 'SIMPLE').toUpperCase(),
          location: ensureObject(c.location),
          images: imgs,
          attribus: ensureObject(c.attribus),
        });
      }
    }

    const data: any = {
      // id_parent: jamais modifié ici (contrôlé par la création)
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
      utilisateurId: dto.utilisateurId,
      competenceId: dto.competenceId ?? null,
      location: dto.location ? ensureObject(dto.location) : undefined,
      images: dto.images ? await this.toCloudinaryUrls(ensureArray(dto.images), folder) : undefined,
      attribus: dto.attribus ? ensureObject(dto.attribus) : undefined,
      composant: newComposant,
    };

    const updated = await this.prisma.infrastructure.update({
      where: { id }, data,
      select: {
        id: true, id_parent: true,
        id_type_infrastructure: true, name: true, description: true, type: true,
        regionId: true, departementId: true, arrondissementId: true, communeId: true,
        domaineId: true, sousdomaineId: true, utilisateurId: true, competenceId: true,
        location: true, images: true, attribus: true, composant: true, updated_at: true,
      },
    });

    return {
      ...updated,
      id: toStrId(updated.id),
      id_parent: updated.id_parent ? toStrId(updated.id_parent as any) : null,
    };
  }

  /* ---------- DELETE ---------- */
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
      'id','id_parent', // 👈 ajouté
      'name','description','type','existing_infrastructure',
      'id_type_infrastructure',
      'regionId','departementId','arrondissementId','communeId',
      'domaineId','sousdomaineId','utilisateurId','competenceId',
      'created_at','updated_at'
    ];
    const rows = full.items.map((r: any) => ([
      r.id,
      r.id_parent ?? '',
      r.name, r.description ?? '', r.type, r.existing_infrastructure ? 1 : 0,
      r.id_type_infrastructure,
      r.regionId, r.departementId, r.arrondissementId, r.communeId,
      r.domaineId ?? '', r.sousdomaineId ?? '', r.utilisateurId ?? '', r.competenceId ?? '',
      r.created_at?.toISOString?.() ?? '', r.updated_at?.toISOString?.() ?? ''
    ].map(v => (typeof v === 'string' && v.includes(',')) ? `"${v.replace(/"/g,'""')}"` : v).join(',')));
    return [headers.join(','), ...rows].join('\n');
  }

  /* ---------- BULK ---------- */
  async validateBulk(items: CreateInfrastructureDto[], defaultUserId?: number) {
    const errors: { index: number; message: string; messageE: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      try {
        await this.ensureTypeExists(it.typeId);
        await this.ensureTerritoryExists(it.regionId, it.departementId, it.arrondissementId, it.communeId);
        await this.ensureClassification(it.domaineId, it.sousdomaineId);
        if (typeof it.utilisateurId === 'number') {
          await this.ensureUserExists(it.utilisateurId);
        } else if (typeof defaultUserId === 'number') {
          await this.ensureUserExists(defaultUserId);
        }
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

  async bulk(items: CreateInfrastructureDto[], currentUserId?: number) {
    const result: { index: number; id?: string; error?: string }[] = [];
    for (let i = 0; i < items.length; i++) {
      try {
        const created = await this.create(items[i], currentUserId);
        result.push({ index: i, id: created.id });
      } catch (e: any) {
        result.push({ index: i, error: e?.message ?? 'unknown error' });
      }
    }
    return result;
  }

  /** 1) Résumé : total + par etat + par type */
  async statsSummary(q: Scope, req: any) {
    const where = applyUserCommune(buildWhere(q), req);

    const [total, simple, complexe] = await this.prisma.$transaction([
      this.prisma.infrastructure.count({ where }),
      this.prisma.infrastructure.count({ where: { ...where, type: 'SIMPLE' } }),
      this.prisma.infrastructure.count({ where: { ...where, type: 'COMPLEXE' } }),
    ]);

    const base = sqlWhereNumeric(where);
    const rows = await this.prisma.$queryRawUnsafe<Array<{ etat: string | null; c: any }>>(`
      SELECT LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat, COUNT(*) AS c
      FROM Infrastructure i
      ${base}
      GROUP BY etat
      ORDER BY c DESC;
    `);

    const byEtat = rows
      .filter(r => r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
      .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
      .sort((a,b) => b.count - a.count);

    return {
      message: 'Résumé des infrastructures.',
      messageE: 'Infrastructures summary.',
      data: {
        total,
        byType: { SIMPLE: simple, COMPLEXE: complexe },
        byEtat,
      },
    };
  }

  /** 2) Groupements (type|region|departement|commune) avec option etats */
  async statsGroup(
    q: Scope & { group: 'type'|'region'|'departement'|'commune'; include_etat?: boolean; limit?: number },
    req: any,
  ) {
    const where = applyUserCommune(buildWhere(q), req);
    const includeEtat = q.include_etat !== false;
    const limit = Number(q.limit ?? 50);

    const col =
      q.group === 'type'        ? 'id_type_infrastructure' :
      q.group === 'region'      ? 'regionId' :
      q.group === 'departement' ? 'departementId' :
                                  'communeId';

    const base = sqlWhereNumeric(where);

    const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
      SELECT ${col} AS k, COUNT(*) AS c
      FROM Infrastructure i
      ${base}
      GROUP BY ${col}
      ORDER BY c DESC;
    `);

    const ids = totals.map(t => t.k).filter((v): v is number => typeof v === 'number');

    // Libellés
    let names = new Map<number, string>();
    if (q.group === 'type' && ids.length) {
      const rows = await this.prisma.typeInfrastructure.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
      names = new Map(rows.map(r => [r.id, r.name]));
    } else if (q.group === 'region' && ids.length) {
      const rows = await this.prisma.region.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
      names = new Map(rows.map(r => [r.id, r.nom]));
    } else if (q.group === 'departement' && ids.length) {
      const rows = await this.prisma.departement.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
      names = new Map(rows.map(r => [r.id, r.nom]));
    } else if (q.group === 'commune' && ids.length) {
      const rows = await this.prisma.commune.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
      names = new Map(rows.map(r => [r.id, r.nom]));
    }

    let etatRows: Array<{ k: number | null; etat: string | null; c: any }> = [];
    if (includeEtat) {
      etatRows = await this.prisma.$queryRawUnsafe(`
        SELECT ${col} AS k,
               LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat,
               COUNT(*) AS c
        FROM Infrastructure i
        ${base}
        GROUP BY ${col}, etat;
      `);
    }

    const items = totals
      .filter(t => typeof t.k === 'number')
      .map(t => {
        const id = t.k as number;
        const count = Number(t.c);
        let etats: Array<{ etat: Etat; count: number }> | undefined;
        if (includeEtat) {
          etats = etatRows
            .filter(r => r.k === id && r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
            .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
            .sort((a,b) => b.count - a.count);
        }
        return { id, name: names.get(id), count, ...(includeEtat ? { etats } : {}) };
      })
      .sort((a,b) => b.count - a.count)
      .slice(0, limit);

    return {
      message: `Groupement par ${q.group}.`,
      messageE: `Grouping by ${q.group}.`,
      group: q.group,
      items,
    };
  }

  /** 3) Groupements par competenceId / domaineId (ordre décroissant) */
  async statsByDimension(
    dim: 'competence'|'domaine',
    q: Scope & { include_etat?: boolean; limit?: number },
    req: any,
  ) {
    const where = applyUserCommune(buildWhere(q), req);
    const includeEtat = q.include_etat !== false;
    const limit = Number(q.limit ?? 50);

    const col = dim === 'competence' ? 'competenceId' : 'domaineId';
    const base = sqlWhereNumeric(where);

    const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
      SELECT ${col} AS k, COUNT(*) AS c
      FROM Infrastructure i
      ${base}
      GROUP BY ${col}
      ORDER BY c DESC;
    `);

    const ids = totals.map(t => t.k).filter((v): v is number => typeof v === 'number');

    let names = new Map<number, string>();
    if (dim === 'competence' && ids.length) {
      const rows = await this.prisma.competence.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
      names = new Map(rows.map(r => [r.id, r.name]));
    } else if (dim === 'domaine' && ids.length) {
      const rows = await this.prisma.domaine.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true } });
      names = new Map(rows.map(r => [r.id, r.nom]));
    }

    let etatRows: Array<{ k: number | null; etat: string | null; c: any }> = [];
    if (includeEtat) {
      etatRows = await this.prisma.$queryRawUnsafe(`
        SELECT ${col} AS k,
               LOWER(JSON_UNQUOTE(JSON_EXTRACT(i.attribus, '$.etat'))) AS etat,
               COUNT(*) AS c
        FROM Infrastructure i
        ${base}
        GROUP BY ${col}, etat;
      `);
    }

    const items = totals
      .filter(t => typeof t.k === 'number')
      .map(t => {
        const id = t.k as number;
        const count = Number(t.c);
        let etats: Array<{ etat: Etat; count: number }> | undefined;
        if (includeEtat) {
          etats = etatRows
            .filter(r => r.k === id && r.etat && (ALLOWED_ETATS as readonly string[]).includes(r.etat))
            .map(r => ({ etat: r.etat as Etat, count: Number(r.c) }))
            .sort((a,b) => b.count - a.count);
        }
        return { id, name: names.get(id), count, ...(includeEtat ? { etats } : {}) };
      })
      .sort((a,b) => b.count - a.count)
      .slice(0, limit);

    return {
      message: `Groupement par ${dim}.`,
      messageE: `Grouping by ${dim}.`,
      group: dim,
      items,
    };
  }
}
