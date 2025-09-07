// import { uploadImageToCloudinary } from './../utils/cloudinary';
// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateInfrastructureDto, ComponentInput } from './dto/create-infra.dto';
// import { UpdateInfrastructureDto } from './dto/update-infra.dto';
// import { DeleteInfrastructureDto } from './dto/delete-infra.dto';

// type Order = Record<string, 'asc' | 'desc'>;

// // infrastructures.service.ts (en haut, à côté des helpers)

// function parseBigIntId(idStr: string, field = 'id'): bigint {
//   if (typeof idStr !== 'string' || !/^\d+$/.test(idStr)) {
//     throw new BadRequestException({
//       message: `${field} invalide (doit être numérique).`,
//       messageE: `Invalid ${field} (must be numeric).`,
//     });
//   }
//   return BigInt(idStr);
// }


// /* ---------- helpers ---------- */
// function ensureObject(v: any) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
// function ensureArray<T = any>(v: any): T[] { return Array.isArray(v) ? v : []; }
// function toStrId(id: bigint | number | string): string { return typeof id === 'bigint' ? id.toString() : String(id); }

// /** Deep-merge (objets) – les arrays sont REMPLACÉS, jamais fusionnés */
// function deepMerge(a: any, b: any): any {
//   if (b === undefined) return a;
//   if (a === undefined) return b;
//   if (Array.isArray(a) && Array.isArray(b)) return b.slice();
//   const aObj = a && typeof a === 'object' && !Array.isArray(a);
//   const bObj = b && typeof b === 'object' && !Array.isArray(b);
//   if (aObj && bObj) {
//     const out: any = { ...a };
//     for (const k of Object.keys(b as Record<string, any>)) {
//       out[k] = deepMerge(a[k], b[k]);
//     }
//     return out;
//   }
//   return b;
// }

// type Scope = {
//   regionId?: number;
//   departementId?: number;
//   arrondissementId?: number;
//   communeId?: number;
//   type?: 'SIMPLE'|'COMPLEXE';
//   typeId?: number;
//   domaineId?: number;
//   sousdomaineId?: number;
//   competenceId?: number;
// };

// /** États autorisés (toujours MAJ) */
// const ALLOWED_ETATS = ['FONCTIONNEL','NON FONCTIONNEL'] as const;
// type Etat = typeof ALLOWED_ETATS[number];

// /** Expression SQL robuste pour lire ETAT depuis attribus (etat|ETAT, string|array) */
// function etatExprSQL(): string {
//   return `
//     UPPER(
//       JSON_UNQUOTE(
//         CASE
//           WHEN JSON_TYPE(COALESCE(JSON_EXTRACT(attribus, '$.etat'), JSON_EXTRACT(attribus, '$."ETAT"'))) = 'ARRAY'
//             THEN JSON_EXTRACT(COALESCE(JSON_EXTRACT(attribus, '$.etat'), JSON_EXTRACT(attribus, '$."ETAT"')), '$[0]')
//           ELSE COALESCE(JSON_EXTRACT(attribus, '$.etat'), JSON_EXTRACT(attribus, '$."ETAT"'))
//         END
//       )
//     )
//   `;
// }

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

// /** WHERE SQL limité aux colonnes numériques whitelistées */
// function sqlWhereNumeric(where: Record<string, any>) {
//   const allowed = ['regionId','departementId','arrondissementId','communeId','id_type_infrastructure','domaineId','sousdomaineId','competenceId'];
//   const parts: string[] = [];
//   for (const [k,v] of Object.entries(where)) {
//     if (v === undefined || v === null) continue;
//     if (allowed.includes(k)) parts.push(`${k}=${Number(v)}`);
//   }
//   return parts.length ? 'WHERE '+parts.join(' AND ') : '';
// }

// /** Restreint le périmètre à la commune du user connecté si définie (écrase les autres niveaux). */
// function applyUserCommune(where: any, req: any) {
//   const userCommuneId = req?.user?.communeId as number | undefined;
//   if (userCommuneId) {
//     where.regionId = undefined;
//     where.departementId = undefined;
//     where.arrondissementId = undefined;
//     where.communeId = userCommuneId;
//   }
//   return where;
// }

// /** Ajoute id_parent: null pour les compteurs globaux root-only (Prisma). */
// function rootOnly(where: any) {
//   return { ...where, id_parent: null as any };
// }

// /** Ajoute "id_parent IS NULL" à un WHERE SQL (déjà construit via sqlWhereNumeric). */
// function sqlWhereWithRoot(base: string): string {
//   return base && base.trim().length ? `${base} AND id_parent IS NULL` : 'WHERE id_parent IS NULL';
// }

// // -------------------------------------------------------------------
// // AJOUTS: helpers pour suppression récursive & archivage
// // -------------------------------------------------------------------

// /** Sélecteur complet pour archiver une ligne d’infrastructure */
// const infraFullSelect = {
//   id: true, id_parent: true, id_type_infrastructure: true,
//   name: true, description: true, existing_infrastructure: true, type: true,
//   regionId: true, departementId: true, arrondissementId: true, communeId: true,
//   domaineId: true, sousdomaineId: true, competenceId: true, utilisateurId: true,
//   location: true, images: true, attribus: true, composant: true,
//   created_at: true, updated_at: true,
// } as const;

// @Injectable()
// export class InfrastructuresService {
//   private static readonly MAX_COMPONENT_DEPTH = 50;

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
//         throw new BadRequestException({ message: `Image invalide ou upload échoué.`, messageE: `Invalid image or upload failed.` });
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
//       throw new BadRequestException({ message: 'Territoire invalide (region/departement/arrondissement/commune).', messageE: 'Invalid territory IDs.' });
//     }
//   }
//   private async ensureClassification(domaineId?: number, sousdomaineId?: number) {
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

//   /* ======================== Normalisation composants ======================== */
//   private async normalizeComponentTree(component: ComponentInput, folder: string, depth = 1): Promise<any> {
//     if (depth > InfrastructuresService.MAX_COMPONENT_DEPTH) {
//       throw new BadRequestException({ message: `Profondeur de composants excessive.`, messageE: `Component depth too large.` });
//     }
//     const c = ensureObject(component);
//     const rawName = typeof (c as any).name === 'string' ? (c as any).name.trim() : '';
//     if (!rawName) throw new BadRequestException({ message: `Chaque composant doit avoir un "name".`, messageE: `Each component must have a "name".` });

//     const t = typeof (c as any).type === 'string' ? (c as any).type.toUpperCase() : 'SIMPLE';
//     const out: any = {
//       name: rawName,
//       type: t === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',
//       description: typeof (c as any).description === 'string' ? (c as any).description : null,
//       location: ensureObject((c as any).location),
//       images: await this.toCloudinaryUrls(ensureArray((c as any).images), folder),
//       attribus: ensureObject((c as any).attribus), // accepte objets imbriqués
//       composant: [],
//     };
//     for (const sub of ensureArray((c as any).composant)) {
//       out.composant.push(await this.normalizeComponentTree(sub, folder, depth + 1));
//     }
//     return out;
//   }

//   private getExistingFlag(c: any): boolean {
//     const v = c?.existingInfrastructure ?? c?.existing_infrastructure;
//     return typeof v === 'boolean' ? v : true;
//   }

//   /**
//    * Crée un composant (et sous-composants) comme lignes `Infrastructure`, relie via `id_parent`,
//    * et renvoie le JSON du composant enrichi avec l’`id` et ses enfants enrichis.
//    * Tous les descendants héritent du contexte (territoire / classification / competence / user) du parent racine.
//    */
//   private async createComponentRecursive(
//     tx: any,
//     ctx: {
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
//     parentId: bigint,
//     depth = 1,
//   ): Promise<any> {
//     if (depth > InfrastructuresService.MAX_COMPONENT_DEPTH) {
//       throw new BadRequestException({ message: `Profondeur de composants excessive.`, messageE: `Component depth too large.` });
//     }

//     const child = await tx.infrastructure.create({
//       data: {
//         id_parent: parentId,
//         id_type_infrastructure: ctx.typeId,
//         name: comp?.name,
//         description: comp?.description ?? null,
//         existing_infrastructure: this.getExistingFlag(comp),
//         type: comp?.type === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',

//         // héritage du parent racine à TOUS les niveaux
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
//         composant: [],
//       },
//       select: { id: true },
//     });

//     const enrichedChildren: any[] = [];
//     for (const sub of ensureArray(comp?.composant)) {
//       const enriched = await this.createComponentRecursive(tx, ctx, sub, child.id, depth + 1);
//       enrichedChildren.push(enriched);
//     }

//     if (enrichedChildren.length) {
//       await tx.infrastructure.update({ where: { id: child.id }, data: { composant: enrichedChildren }, select: { id: true } });
//     }

//     return { ...comp, id: toStrId(child.id), composant: enrichedChildren };
//   }

//   /* ---------- LIST ---------- */
//   async list(params: {
//     page: number; pageSize: number; sort?: Order;
//     regionId?: number; departementId?: number; arrondissementId?: number; communeId?: number;
//     typeId?: number; type?: string; q?: string; domaineId?: number; sousdomaineId?: number; utilisateurId?: number;
//     created_from?: string; created_to?: string; competenceId?: number; req?: any;
//   }) {
//     const {
//       page, pageSize, sort,
//       regionId, departementId, arrondissementId, communeId,
//       typeId, type, q, domaineId, sousdomaineId, utilisateurId, created_from, created_to, competenceId, req
//     } = params;
//     const userCommuneId = req?.user?.communeId as number | undefined;

//     const where: any = { id_parent: null };
//     if (typeof regionId === 'number') where.regionId = regionId;
//     if (typeof departementId === 'number') where.departementId = departementId;
//     if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
//     if (typeof communeId === 'number') where.communeId = communeId;
//     if (typeof utilisateurId === 'number') where.utilisateurId = utilisateurId;
//     if (typeof competenceId === 'number') where.competenceId = competenceId;

//     // 🔒 Scope commune utilisateur prioritaire
//     if (userCommuneId) where.communeId = userCommuneId;

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
//           id: true, id_parent: true, id_type_infrastructure: true,
//           typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } },
//           name: true, description: true, existing_infrastructure: true, type: true,
//           regionId: true, region: true,
//           departementId: true, departement: true,
//           arrondissementId: true, arrondissement: true,
//           communeId: true, commune: true,
//           domaineId: true, domaine: { select: { id: true, nom: true, code: true } },
//           sousdomaineId: true, sousdomaine: { select: { id: true, nom: true, code: true } },
//           competenceId: true, competence: { select: { id: true, name: true } },
//           location: true, images: true, attribus: true, composant: true,
//           created_at: true, updated_at: true,
//         },
//       }),
//     ]);

//     const items = rows.map(r => ({
//       ...r,
//       id: toStrId(r.id),
//       id_parent: r.id_parent ? toStrId(r.id_parent as any) : null,
//       name_type_infrastructure: r.typeRef.name,
//     }));
//     return { total, items };
//   }

//   /* ---------- CREATE (récursif avec héritage racine) ---------- */
//   async create(dto: CreateInfrastructureDto, currentUserId?: number) {
//     await this.ensureTypeExists(dto.typeId);
//     await this.ensureTerritoryExists(dto.regionId, dto.departementId, dto.arrondissementId, dto.communeId);
//     await this.ensureClassification(dto.domaineId, dto.sousdomaineId);

//     const creatorId = dto.utilisateurId ?? currentUserId ?? null;
//     await this.ensureUserExists(creatorId ?? undefined);

//     const parentFolder = `infrastructures/${dto.communeId}`;

//     const normalizedComponents: any[] = [];
//     for (const c of ensureArray(dto.composant)) {
//       normalizedComponents.push(await this.normalizeComponentTree(c, `${parentFolder}/components`));
//     }

//     const dataParent: any = {
//       id_parent: null,
//       id_type_infrastructure: dto.typeId,
//       name: dto.name,
//       description: dto.description ?? null,
//       existing_infrastructure: dto.existing_infrastructure ?? true,
//       type: dto.type ?? 'SIMPLE',
//       regionId: dto.regionId,
//       departementId: dto.departementId,
//       arrondissementId: dto.arrondissementId,
//       communeId: dto.communeId,
//       domaineId: dto.domaineId ?? null,
//       sousdomaineId: dto.sousdomaineId ?? null,
//       competenceId: dto.competenceId ?? null,
//       utilisateurId: creatorId,
//       location: ensureObject(dto.location),
//       images: await this.toCloudinaryUrls(ensureArray(dto.images), parentFolder),
//       attribus: ensureObject(dto.attribus),
//       composant: [],
//     };

//     const result = await this.prisma.$transaction(async (tx) => {
//       const parent = await tx.infrastructure.create({ data: dataParent, select: { id: true } });

//       const ctx = {
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

//       const enrichedChildren: any[] = [];
//       for (const comp of normalizedComponents) {
//         enrichedChildren.push(await this.createComponentRecursive(tx, ctx, comp, parent.id));
//       }

//       if (enrichedChildren.length) {
//         await tx.infrastructure.update({ where: { id: parent.id }, data: { composant: enrichedChildren }, select: { id: true } });
//       }

//       return { id: toStrId(parent.id), composants: enrichedChildren };
//     });

//     return result;
//   }

//   /* ===================== UPDATE (pro & synchronisation des composants) ===================== */

//   private async deleteSubtree(tx: any, id: bigint): Promise<void> {
//     const children = await tx.infrastructure.findMany({ where: { id_parent: id }, select: { id: true } });
//     for (const ch of children) await this.deleteSubtree(tx, ch.id);
//     await tx.infrastructure.delete({ where: { id } });
//   }

//   private async syncChildren(
//     tx: any,
//     ctx: {
//       creatorId: number | null; typeId: number;
//       regionId: number; departementId: number; arrondissementId: number; communeId: number;
//       domaineId: number | null; sousdomaineId: number | null; competenceId: number | null;
//       folder: string;
//     },
//     parentId: bigint,
//     inputs: ComponentInput[],
//     mode: 'merge'|'replace' = 'merge',
//     depth = 1,
//   ): Promise<any[]> {
//     if (depth > InfrastructuresService.MAX_COMPONENT_DEPTH) {
//       throw new BadRequestException({ message: `Profondeur de composants excessive.`, messageE: `Component depth too large.` });
//     }

//     const existing = await tx.infrastructure.findMany({
//       where: { id_parent: parentId },
//       select: {
//         id: true, name: true, type: true, description: true,
//         location: true, images: true, attribus: true,
//       },
//     }) as Array<{
//       id: bigint; name: string; type: string; description: string | null;
//       location: any; images: any; attribus: any;
//     }>;
//     const byId = new Map<string, typeof existing[number]>(existing.map(e => [toStrId(e.id), e]));
//     const used = new Set<string>();
//     const enriched: any[] = [];

//     for (const raw of ensureArray(inputs)) {
//       const cid = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;

//       if (cid && byId.has(cid)) {
//         // UPDATE existant
//         used.add(cid);
//         const row = byId.get(cid)!;

//         const nextImages = raw.images !== undefined
//           ? await this.toCloudinaryUrls(ensureArray(raw.images), `${ctx.folder}/components`)
//           : undefined;

//         let nextAttribus: any | undefined = undefined;
//         if (raw.attribus !== undefined) {
//           nextAttribus = deepMerge(row.attribus, raw.attribus);
//         }

//         let nextLocation: any | undefined = undefined;
//         if (raw.location !== undefined) {
//           nextLocation = deepMerge(row.location, raw.location);
//         }

//         await tx.infrastructure.update({
//           where: { id: BigInt(cid) },
//           data: {
//             // héritage racine (garantie de cohérence)
//             id_type_infrastructure: ctx.typeId,
//             regionId: ctx.regionId, departementId: ctx.departementId,
//             arrondissementId: ctx.arrondissementId, communeId: ctx.communeId,
//             domaineId: ctx.domaineId, sousdomaineId: ctx.sousdomaineId, competenceId: ctx.competenceId,
//             utilisateurId: ctx.creatorId,

//             name: raw.name ?? row.name,
//             description: raw.description === undefined ? row.description : (raw.description ?? null),
//             type: (raw.type ?? row.type) === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',
//             images: (nextImages as any) ?? (row.images as any),
//             location: nextLocation ?? row.location,
//             attribus: nextAttribus ?? row.attribus,
//           },
//           select: { id: true },
//         });

//         // recurse
//         let childrenJson: any[] = [];
//         if (raw.composant !== undefined) {
//           childrenJson = await this.syncChildren(tx, ctx, BigInt(cid), raw.composant!, mode, depth + 1);
//           await tx.infrastructure.update({ where: { id: BigInt(cid) }, data: { composant: childrenJson } });
//         } else {
//           const existed = await tx.infrastructure.findUnique({ where: { id: BigInt(cid) }, select: { composant: true } });
//           childrenJson = ensureArray(existed?.composant);
//         }

//         enriched.push({
//           id: cid,
//           name: raw.name ?? row.name,
//           type: (raw.type ?? row.type) === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',
//           description: raw.description === undefined ? row.description : (raw.description ?? null),
//           location: nextLocation ?? row.location,
//           images: (nextImages as any) ?? (row.images as any),
//           attribus: nextAttribus ?? row.attribus,
//           composant: childrenJson,
//         });

//       } else {
//         // CREATE nouveau
//         const norm = await this.normalizeComponentTree(raw, `${ctx.folder}/components`);
//         const created = await this.createComponentRecursive(tx, ctx, norm, parentId, depth);
//         enriched.push(created);
//       }
//     }

//     // DELETE manquants si mode replace
//     if (mode === 'replace') {
//       for (const e of existing) {
//         const key = toStrId(e.id);
//         if (!used.has(key)) {
//           await this.deleteSubtree(tx, e.id);
//         }
//       }
//     }

//     return enriched;
//   }

//   async update(idStr: string, dto: UpdateInfrastructureDto) {
//     const id = BigInt(idStr);
//     const current = await this.prisma.infrastructure.findUnique({
//       where: { id },
//       select: {
//         id: true, id_parent: true,
//         id_type_infrastructure: true, name: true, description: true, type: true,
//         existing_infrastructure: true,
//         regionId: true, departementId: true, arrondissementId: true, communeId: true,
//         domaineId: true, sousdomaineId: true, utilisateurId: true, competenceId: true,
//         location: true, images: true, attribus: true,
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

//     await this.ensureClassification(dto.domaineId ?? current.domaineId ?? undefined, dto.sousdomaineId ?? current.sousdomaineId ?? undefined);
//     if (typeof dto.utilisateurId === 'number') await this.ensureUserExists(dto.utilisateurId);

//     const folder = `infrastructures/${effCom}`;

//     const nextImages = dto.images !== undefined
//       ? await this.toCloudinaryUrls(ensureArray(dto.images), folder)
//       : undefined;

//     const attribusMode = dto.attribus_mode ?? 'merge';
//     const nextAttribus =
//       dto.attribus === undefined
//         ? undefined
//         : (attribusMode === 'replace' ? ensureObject(dto.attribus) : deepMerge(current.attribus, dto.attribus));

//     const nextLocation =
//       dto.location === undefined
//         ? undefined
//         : deepMerge(current.location, dto.location);

//     const result = await this.prisma.$transaction(async (tx) => {
//       // 1) Update du parent
//       await tx.infrastructure.update({
//         where: { id },
//         data: {
//           id_type_infrastructure: effTypeId,
//           name: dto.name ?? current.name,
//           description: dto.description === undefined ? current.description : (dto.description ?? null),
//           existing_infrastructure: dto.existing_infrastructure ?? current.existing_infrastructure,
//           type: (dto.type ?? current.type) === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',

//           regionId: effRegion, departementId: effDep, arrondissementId: effArr, communeId: effCom,
//           domaineId: dto.domaineId ?? current.domaineId,
//           sousdomaineId: dto.sousdomaineId ?? current.sousdomaineId,
//           competenceId: dto.competenceId ?? current.competenceId,
//           utilisateurId: dto.utilisateurId ?? current.utilisateurId,

//           images: (nextImages as any) ?? (current.images as any),
//           location: nextLocation ?? current.location,
//           attribus: nextAttribus ?? current.attribus,
//         },
//         select: { id: true },
//       });

//       // 2) Enfants si fournis
//       if (dto.composant !== undefined) {
//         const ctx = {
//           creatorId: dto.utilisateurId ?? current.utilisateurId ?? null,
//           typeId: effTypeId,
//           regionId: effRegion, departementId: effDep, arrondissementId: effArr, communeId: effCom,
//           domaineId: dto.domaineId ?? current.domaineId ?? null,
//           sousdomaineId: dto.sousdomaineId ?? current.sousdomaineId ?? null,
//           competenceId: dto.competenceId ?? current.competenceId ?? null,
//           folder,
//         };
//         const newChildrenJson = await this.syncChildren(tx, ctx, id, dto.composant, dto.composant_mode ?? 'merge');
//         await tx.infrastructure.update({ where: { id }, data: { composant: newChildrenJson } });
//       }

//       // 3) retourne l’obj final
//       const updated = await tx.infrastructure.findUnique({
//         where: { id },
//         select: {
//           id: true, id_parent: true,
//           id_type_infrastructure: true, name: true, description: true, type: true,
//           regionId: true, departementId: true, arrondissementId: true, communeId: true,
//           domaineId: true, sousdomaineId: true, utilisateurId: true, competenceId: true,
//           location: true, images: true, attribus: true, composant: true, updated_at: true,
//         },
//       });

//       return {
//         ...updated!,
//         id: toStrId(updated!.id),
//         id_parent: updated!.id_parent ? toStrId(updated!.id_parent as any) : null,
//       };
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
//         id_parent: true,
//         id_type_infrastructure: true,
//         name: true,
//         description: true,
//         existing_infrastructure: true,
//         type: true,
//         regionId: true, departementId: true, arrondissementId: true, communeId: true,
//         domaineId: true, sousdomaineId: true,
//         utilisateurId: true, competenceId: true,
//         location: true, images: true, attribus: true, composant: true,
//         created_at: true, updated_at: true,
//         ...(include?.includes('type') ? { typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } } } : {}),
//         ...(include?.includes('territory') ? {
//           region:        { select: { id: true, nom: true } },
//           departement:   { select: { id: true, nom: true} },
//           arrondissement:{ select: { id: true, nom: true } },
//           commune:       { select: { id: true, nom: true } },
//           competence:    { select: { id: true, name: true } },
//         } : {}),
//       },
//     });
//     if (!row) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

//     return { ...row, id: toStrId(row.id), id_parent: row.id_parent ? toStrId(row.id_parent as any) : null };
//   }

//   /* ---------- DELETE (simple) ---------- */
//   async remove(idStr: string) {
//     const id = BigInt(idStr);
//     const exists = await this.prisma.infrastructure.count({ where: { id } });
//     if (!exists) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });
//     await this.prisma.infrastructure.delete({ where: { id } });
//   }

//   /* ---------- EXPORT CSV (root only via list) ---------- */
//   async exportCsv(params: Parameters<InfrastructuresService['list']>[0]) {
//     const full = await this.list({ ...params, page: 1, pageSize: 100000, sort: params.sort });
//     const headers = [
//       'id','id_parent','name','description','type','existing_infrastructure',
//       'id_type_infrastructure','regionId','departementId','arrondissementId','communeId',
//       'domaineId','sousdomaineId','utilisateurId','competenceId','created_at','updated_at'
//     ];
//     const rows = full.items.map((r: any) => ([
//       r.id, r.id_parent ?? '', r.name, r.description ?? '', r.type, r.existing_infrastructure ? 1 : 0,
//       r.id_type_infrastructure, r.regionId, r.departementId, r.arrondissementId, r.communeId,
//       r.domaineId ?? '', r.sousdomaineId ?? '', r.utilisateurId ?? '', r.competenceId ?? '',
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

//   /* ---------- Stats (ROOT-ONLY pour les totaux / groupements) ---------- */
//   async statsSummary(q: Scope, req: any) {
//     // root only + scope commune
//     const where = rootOnly(applyUserCommune(buildWhere(q), req));

//     const [total, simple, complexe] = await this.prisma.$transaction([
//       this.prisma.infrastructure.count({ where }),
//       this.prisma.infrastructure.count({ where: { ...where, type: 'SIMPLE' } }),
//       this.prisma.infrastructure.count({ where: { ...where, type: 'COMPLEXE' } }),
//     ]);

//     // by ETAT (root-only en SQL)
//     const base = sqlWhereNumeric(where);            // (id_parent n'est pas pris en charge ici)
//     const baseRoot = sqlWhereWithRoot(base);        // on ajoute id_parent IS NULL
//     const etatExpr = etatExprSQL();
//     const rows = await this.prisma.$queryRawUnsafe<Array<{ etat: string | null; c: any }>>(`
//       SELECT ${etatExpr} AS etat, COUNT(*) AS c
//       FROM Infrastructure i
//       ${baseRoot}
//       GROUP BY etat
//       ORDER BY c DESC;
//     `);

//     const map = new Map<string, number>();
//     for (const r of rows || []) {
//       const k = (r.etat || '').toString().trim().toUpperCase();
//       if (!k) continue;
//       map.set(k, (map.get(k) ?? 0) + Number(r.c ?? 0));
//     }
//     const byEtat = (ALLOWED_ETATS as readonly string[]).map(e => ({ etat: e as Etat, count: map.get(e) ?? 0 }));

//     return {
//       message: 'Résumé des infrastructures.',
//       messageE: 'Infrastructures summary.',
//       data: { total, byType: { SIMPLE: simple, COMPLEXE: complexe }, byEtat },
//     };
//   }

//   /** Groupements (type|region|departement|commune) — ROOT ONLY — option etats */
//   async statsGroup(
//     q: Scope & { group: 'type'|'region'|'departement'|'commune'; include_etat?: boolean; limit?: number },
//     req: any,
//   ) {
//     const scoped = applyUserCommune(buildWhere(q), req);
//     const where = rootOnly(scoped);
//     const includeEtat = q.include_etat !== false;
//     const limit = Number(q.limit ?? 50);

//     const col =
//       q.group === 'type'        ? 'id_type_infrastructure' :
//       q.group === 'region'      ? 'regionId' :
//       q.group === 'departement' ? 'departementId' :
//                                   'communeId';

//     const base = sqlWhereNumeric(where);
//     const baseRoot = sqlWhereWithRoot(base);

//     const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
//       SELECT ${col} AS k, COUNT(*) AS c
//       FROM Infrastructure i
//       ${baseRoot}
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
//       const etatExpr = etatExprSQL();
//       etatRows = await this.prisma.$queryRawUnsafe(`
//         SELECT ${col} AS k,
//                ${etatExpr} AS etat,
//                COUNT(*) AS c
//         FROM Infrastructure i
//         ${baseRoot}
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
//           const bucket = new Map<string, number>();
//           for (const r of etatRows || []) {
//             if (r.k !== id) continue;
//             const k = (r.etat || '').toString().toUpperCase();
//             if (!k) continue;
//             bucket.set(k, (bucket.get(k) ?? 0) + Number(r.c ?? 0));
//           }
//           etats = (ALLOWED_ETATS as readonly string[]).map(e => ({ etat: e as Etat, count: bucket.get(e) ?? 0 }));
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

//   /** Groupements par competenceId / domaineId — ROOT ONLY (ordre décroissant) */
//   async statsByDimension(
//     dim: 'competence'|'domaine',
//     q: Scope & { include_etat?: boolean; limit?: number },
//     req: any,
//   ) {
//     const scoped = applyUserCommune(buildWhere(q), req);
//     const where = rootOnly(scoped);
//     const includeEtat = q.include_etat !== false;
//     const limit = Number(q.limit ?? 50);

//     const col = dim === 'competence' ? 'competenceId' : 'domaineId';
//     const base = sqlWhereNumeric(where);
//     const baseRoot = sqlWhereWithRoot(base);

//     const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
//       SELECT ${col} AS k, COUNT(*) AS c
//       FROM Infrastructure i
//       ${baseRoot}
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
//       const etatExpr = etatExprSQL();
//       etatRows = await this.prisma.$queryRawUnsafe(`
//         SELECT ${col} AS k,
//                ${etatExpr} AS etat,
//                COUNT(*) AS c
//         FROM Infrastructure i
//         ${baseRoot}
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
//           const bucket = new Map<string, number>();
//           for (const r of etatRows || []) {
//             if (r.k !== id) continue;
//             const k = (r.etat || '').toString().toUpperCase();
//             if (!k) continue;
//             bucket.set(k, (bucket.get(k) ?? 0) + Number(r.c ?? 0));
//           }
//           etats = (ALLOWED_ETATS as readonly string[]).map(e => ({ etat: e as Etat, count: bucket.get(e) ?? 0 }));
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

//   /** Upload (base64 dataURL ou http) vers Cloudinary pour la preuve */
//   private async toProofURL(input: string, folder: string): Promise<string> {
//     if (typeof input !== 'string' || !input.trim()) {
//       throw new BadRequestException({ message: 'Fichier justificatif requis.', messageE: 'Proof file required.' });
//     }
//     if (/^data:(image\/.+|application\/pdf);base64,/.test(input)) {
//       return await uploadImageToCloudinary(input, folder);
//     }
//     if (/^https?:\/\//i.test(input)) return input;
//     throw new BadRequestException({ message: 'Format de fichier non supporté.', messageE: 'Unsupported proof file format.' });
//   }

//   /** Récupère récursivement toute la sous-arborescence (parent + enfants n niveaux). */
//   private async collectSubtreeRows(rootId: bigint) {
//     const root = await this.prisma.infrastructure.findUnique({
//       where: { id: rootId },
//       select: infraFullSelect,
//     });
//     if (!root) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

//     const all: typeof root[] = [root];
//     // niveaux (pour suppression du fond vers le haut si nécessaire)
//     const levels: bigint[][] = [[rootId]];
//     let idx = 0;

//     while (idx < levels.length) {
//       const parentIds = levels[idx];
//       const children = await this.prisma.infrastructure.findMany({
//         where: { id_parent: { in: parentIds } },
//         select: infraFullSelect,
//       });

//       if (!children.length) break;
//       all.push(...children);

//       const nextLevelIds = children.map(c => c.id as bigint);
//       levels.push(nextLevelIds);
//       idx++;
//     }

//     return { root, all, levels };
//   }

//   /** Archive en masse dans DeletedInfrastructure (conserve les mêmes champs + reason/fileURL). */
//   private async archiveRows(rows: Array<any>, reason: string, fileURL: string, tx: any) {
//     const data = rows.map(r => ({
//       id: r.id as bigint,
//       id_parent: r.id_parent as bigint | null,
//       id_type_infrastructure: r.id_type_infrastructure,
//       name: r.name,
//       description: r.description,
//       existing_infrastructure: r.existing_infrastructure,
//       type: r.type,
//       regionId: r.regionId,
//       departementId: r.departementId,
//       arrondissementId: r.arrondissementId,
//       communeId: r.communeId,
//       domaineId: r.domaineId,
//       sousdomaineId: r.sousdomaineId,
//       competenceId: r.competenceId,
//       utilisateurId: r.utilisateurId,
//       location: r.location as any,
//       images: r.images as any,
//       attribus: r.attribus as any,
//       composant: r.composant as any,
//       created_at: r.created_at,
//       updated_at: r.updated_at,
//       reason,
//       fileURL,
//     }));

//     await tx.deletedInfrastructure.createMany({
//       data,
//       skipDuplicates: true,
//     });

//     return data.length;
//   }

//   /**
//    * Supprime une infrastructure + tous ses descendants, APRES archivage.
//    * - Upload du justificatif -> fileURL
//    * - Collecte récursive (n niveaux)
//    * - Archive createMany()
//    * - Delete du plus profond vers la racine (par niveaux)
//    */
//   async archiveAndDelete(idStr: string, body: DeleteInfrastructureDto) {
//     if (!idStr) throw new BadRequestException({ message: 'ID requis.', messageE: 'ID required.' });
//     const id = BigInt(idStr);

//     const reason = (body?.reason ?? '').toString().trim();
//     if (!reason) throw new BadRequestException({ message: 'Raison requise.', messageE: 'Reason required.' });

//     const fileURL = await this.toProofURL(body.proofFile, `infrastructures/deleted/proofs`);

//     // Collecter arbre complet
//     const { all, levels } = await this.collectSubtreeRows(id);

//     // Transaction: archive -> delete (du bas vers le haut)
//     const res = await this.prisma.$transaction(async (tx) => {
//       const archivedCount = await this.archiveRows(all, reason, fileURL, tx);

//       // Supprimer du plus profond au plus haut
//       for (let depth = levels.length - 1; depth >= 0; depth--) {
//         const idsAtLevel = levels[depth];
//         if (!idsAtLevel.length) continue;
//         await tx.infrastructure.deleteMany({ where: { id: { in: idsAtLevel } } });
//       }

//       return { archivedCount, deletedCount: all.length, fileURL, reason };
//     });

//     return res;
//   }

//   // -------------------------------------------------------------------
//   // Listing / détail des éléments archivés (pas de req ici → inchangé)
//   // -------------------------------------------------------------------

//   async listDeleted(params: {
//     page: number; pageSize: number; sort?: Order;
//     q?: string; type?: string; regionId?: number; departementId?: number; arrondissementId?: number; communeId?: number;
//     typeId?: number; domaineId?: number; sousdomaineId?: number; competenceId?: number; utilisateurId?: number;
//   }) {
//     const {
//       page, pageSize, sort, q, type,
//       regionId, departementId, arrondissementId, communeId,
//       typeId, domaineId, sousdomaineId, competenceId, utilisateurId,
//     } = params;

//     const where: any = {};
//     if (q) {
//       where.OR = [
//         { name:        { contains: q, mode: 'insensitive' } },
//         { description: { contains: q, mode: 'insensitive' } },
//         { reason:      { contains: q, mode: 'insensitive' } },
//       ];
//     }
//     if (type) where.type = type;
//     if (typeof regionId === 'number') where.regionId = regionId;
//     if (typeof departementId === 'number') where.departementId = departementId;
//     if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
//     if (typeof communeId === 'number') where.communeId = communeId;
//     if (typeof utilisateurId === 'number') where.utilisateurId = utilisateurId;
//     if (typeof competenceId === 'number') where.competenceId = competenceId;
//     if (typeof domaineId === 'number') where.domaineId = domaineId;
//     if (typeof sousdomaineId === 'number') where.sousdomaineId = sousdomaineId;
//     if (typeof typeId === 'number') where.id_type_infrastructure = typeId;

//     const [total, rows] = await this.prisma.$transaction([
//       this.prisma.deletedInfrastructure.count({ where }),
//       this.prisma.deletedInfrastructure.findMany({
//         where,
//         orderBy: sort ?? { id: 'desc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true, id_parent: true, id_type_infrastructure: true,
//           name: true, description: true, existing_infrastructure: true, type: true,
//           regionId: true, departementId: true, arrondissementId: true, communeId: true,
//           domaineId: true, sousdomaineId: true, competenceId: true, utilisateurId: true,
//           location: true, images: true, attribus: true, composant: true,
//           created_at: true, updated_at: true,
//           reason: true, fileURL: true,
//         },
//       }),
//     ]);

//     const items = rows.map(r => ({
//       ...r,
//       id: r.id.toString(),
//       id_parent: r.id_parent ? r.id_parent.toString() : null,
//     }));

//     return { total, items };
//   }

//   async findOneDeleted(idStr: string) {
//     const id = BigInt(idStr);
//     const row = await this.prisma.deletedInfrastructure.findUnique({
//       where: { id },
//       select: {
//         id: true, id_parent: true, id_type_infrastructure: true,
//         name: true, description: true, existing_infrastructure: true, type: true,
//         regionId: true, departementId: true, arrondissementId: true, communeId: true,
//         domaineId: true, sousdomaineId: true, competenceId: true, utilisateurId: true,
//         location: true, images: true, attribus: true, composant: true,
//         created_at: true, updated_at: true,
//         reason: true, fileURL: true,
//       },
//     });
//     if (!row) {
//       throw new NotFoundException({ message: 'Elément archivé introuvable.', messageE: 'Archived item not found.' });
//     }
//     return {
//       ...row,
//       id: row.id.toString(),
//       id_parent: row.id_parent ? row.id_parent.toString() : null,
//     };
//   }
// }


import { uploadImageToCloudinary } from './../utils/cloudinary';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInfrastructureDto, ComponentInput } from './dto/create-infra.dto';
import { UpdateInfrastructureDto } from './dto/update-infra.dto';
import { DeleteInfrastructureDto } from './dto/delete-infra.dto';

type Order = Record<string, 'asc' | 'desc'>;

// infrastructures.service.ts (en haut, à côté des helpers)

function parseBigIntId(idStr: string, field = 'id'): bigint {
  if (typeof idStr !== 'string' || !/^\d+$/.test(idStr)) {
    throw new BadRequestException({
      message: `${field} invalide (doit être numérique).`,
      messageE: `Invalid ${field} (must be numeric).`,
    });
  }
  return BigInt(idStr);
}


/* ---------- helpers ---------- */
function ensureObject(v: any) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
function ensureArray<T = any>(v: any): T[] { return Array.isArray(v) ? v : []; }
function toStrId(id: bigint | number | string): string { return typeof id === 'bigint' ? id.toString() : String(id); }

/** Deep-merge (objets) – les arrays sont REMPLACÉS, jamais fusionnés */
function deepMerge(a: any, b: any): any {
  if (b === undefined) return a;
  if (a === undefined) return b;
  if (Array.isArray(a) && Array.isArray(b)) return b.slice();
  const aObj = a && typeof a === 'object' && !Array.isArray(a);
  const bObj = b && typeof b === 'object' && !Array.isArray(b);
  if (aObj && bObj) {
    const out: any = { ...a };
    for (const k of Object.keys(b as Record<string, any>)) {
      out[k] = deepMerge(a[k], b[k]);
    }
    return out;
  }
  return b;
}

/** Accepte uniquement des entiers positifs (number) ou chaînes numériques strictes */
function parseTypeIdCandidate(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0) return raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (/^\d+$/.test(s)) return Number(s);
  }
  return null;
}

type Scope = {
  regionId?: number;
  departementId?: number;
  arrondissementId?: number;
  communeId?: number;
  type?: 'SIMPLE'|'COMPLEXE';
  typeId?: number;
  domaineId?: number;
  sousdomaineId?: number;
  competenceId?: number;
};

/** États autorisés (toujours MAJ) */
const ALLOWED_ETATS = ['FONCTIONNEL','NON FONCTIONNEL'] as const;
type Etat = typeof ALLOWED_ETATS[number];

/** Expression SQL robuste pour lire ETAT depuis attribus (etat|ETAT, string|array) */
function etatExprSQL(): string {
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

/** WHERE SQL limité aux colonnes numériques whitelistées */
function sqlWhereNumeric(where: Record<string, any>) {
  const allowed = ['regionId','departementId','arrondissementId','communeId','id_type_infrastructure','domaineId','sousdomaineId','competenceId'];
  const parts: string[] = [];
  for (const [k,v] of Object.entries(where)) {
    if (v === undefined || v === null) continue;
    if (allowed.includes(k)) parts.push(`${k}=${Number(v)}`);
  }
  return parts.length ? 'WHERE '+parts.join(' AND ') : '';
}

/** Restreint le périmètre à la commune du user connecté si définie (écrase les autres niveaux). */
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

/** Ajoute id_parent: null pour les compteurs globaux root-only (Prisma). */
function rootOnly(where: any) {
  return { ...where, id_parent: null as any };
}

/** Ajoute "id_parent IS NULL" à un WHERE SQL (déjà construit via sqlWhereNumeric). */
function sqlWhereWithRoot(base: string): string {
  return base && base.trim().length ? `${base} AND id_parent IS NULL` : 'WHERE id_parent IS NULL';
}

// -------------------------------------------------------------------
// AJOUTS: helpers pour suppression récursive & archivage
// -------------------------------------------------------------------

/** Sélecteur complet pour archiver une ligne d’infrastructure */
const infraFullSelect = {
  id: true, id_parent: true, id_type_infrastructure: true,
  name: true, description: true, existing_infrastructure: true, type: true,
  regionId: true, departementId: true, arrondissementId: true, communeId: true,
  domaineId: true, sousdomaineId: true, competenceId: true, utilisateurId: true,
  location: true, images: true, attribus: true, composant: true,
  created_at: true, updated_at: true,
} as const;

@Injectable()
export class InfrastructuresService {
  private static readonly MAX_COMPONENT_DEPTH = 50;

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
        throw new BadRequestException({ message: `Image invalide ou upload échoué.`, messageE: `Invalid image or upload failed.` });
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
      throw new BadRequestException({ message: 'Territoire invalide (region/departement/arrondissement/commune).', messageE: 'Invalid territory IDs.' });
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
  private async ensureUserExists(utilisateurId?: number) {
    if (typeof utilisateurId !== 'number') return;
    const cnt = await this.prisma.utilisateur.count({ where: { id: utilisateurId } });
    if (!cnt) throw new BadRequestException({ message: 'Utilisateur (créateur) invalide.', messageE: 'Invalid user (creator).' });
  }

  /* ======================== Normalisation composants ======================== */
  private async normalizeComponentTree(
    component: ComponentInput,
    folder: string,
    depth = 1,
    treatIdAsTypeRef = false,   // <= en CREATE on l'active
  ): Promise<any> {
    if (depth > InfrastructuresService.MAX_COMPONENT_DEPTH) {
      throw new BadRequestException({ message: `Profondeur de composants excessive.`, messageE: `Component depth too large.` });
    }
    const c = ensureObject(component);
    const rawName = typeof (c as any).name === 'string' ? (c as any).name.trim() : '';
    if (!rawName) throw new BadRequestException({ message: `Chaque composant doit avoir un "name".`, messageE: `Each component must have a "name".` });

    // si on est en CREATE, on peut interpréter "id" comme un typeId candidat (uniquement numérique strict)
    const typeRefIdCandidate = treatIdAsTypeRef ? parseTypeIdCandidate((c as any).id) : null;

    const t = typeof (c as any).type === 'string' ? (c as any).type.toUpperCase() : 'SIMPLE';
    const out: any = {
      // interne: utilisé seulement à la création, pas persisté dans le JSON final
      __typeRefId: typeRefIdCandidate,

      name: rawName,
      type: t === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',
      description: typeof (c as any).description === 'string' ? (c as any).description : null,
      location: ensureObject((c as any).location),
      images: await this.toCloudinaryUrls(ensureArray((c as any).images), folder),
      attribus: ensureObject((c as any).attribus),
      composant: [],
    };
    for (const sub of ensureArray((c as any).composant)) {
      out.composant.push(await this.normalizeComponentTree(sub, folder, depth + 1, treatIdAsTypeRef));
    }
    return out;
  }

  private getExistingFlag(c: any): boolean {
    const v = c?.existingInfrastructure ?? c?.existing_infrastructure;
    return typeof v === 'boolean' ? v : true;
  }

  /**
   * Crée un composant (et sous-composants) comme lignes `Infrastructure`, relie via `id_parent`,
   * et renvoie le JSON du composant enrichi avec l’`id` et ses enfants enrichis.
   * Héritage territory/classif/user depuis le parent racine.
   * Le **type** hérite du parent immédiat sauf si l’enfant fournit un **TypeInfrastructure.id** valide.
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
    depth = 1,
  ): Promise<any> {
    if (depth > InfrastructuresService.MAX_COMPONENT_DEPTH) {
      throw new BadRequestException({ message: `Profondeur de composants excessive.`, messageE: `Component depth too large.` });
    }

    // type effectif pour CE composant
    let effectiveTypeId = ctx.typeId;
    const candidate = parseTypeIdCandidate(comp?.__typeRefId);
    if (candidate !== null) {
      try {
        const ok = await tx.typeInfrastructure.count({ where: { id: candidate } });
        if (ok) effectiveTypeId = candidate;
      } catch {
        effectiveTypeId = ctx.typeId; // fallback silencieux
      }
    }

    const child = await tx.infrastructure.create({
      data: {
        id_parent: parentId,
        id_type_infrastructure: effectiveTypeId,

        name: comp?.name,
        description: comp?.description ?? null,
        existing_infrastructure: this.getExistingFlag(comp),
        type: comp?.type === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',

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

    const enrichedChildren: any[] = [];
    if (Array.isArray(comp?.composant) && comp.composant.length) {
      for (const sub of comp.composant) {
        const childCtx = { ...ctx, typeId: effectiveTypeId };
        const enriched = await this.createComponentRecursive(tx, childCtx, sub, child.id, depth + 1);
        enrichedChildren.push(enriched);
      }
      await tx.infrastructure.update({
        where: { id: child.id },
        data: { composant: enrichedChildren },
        select: { id: true },
      });
    }

    const { __typeRefId, ...compOut } = comp;
    return { ...compOut, id: toStrId(child.id), composant: enrichedChildren };
  }

  /* ---------- LIST ---------- */
  async list(params: {
    page: number; pageSize: number; sort?: Order;
    regionId?: number; departementId?: number; arrondissementId?: number; communeId?: number;
    typeId?: number; type?: string; q?: string; domaineId?: number; sousdomaineId?: number; utilisateurId?: number;
    created_from?: string; created_to?: string; competenceId?: number; req?: any;
  }) {
    const {
      page, pageSize, sort,
      regionId, departementId, arrondissementId, communeId,
      typeId, type, q, domaineId, sousdomaineId, utilisateurId, created_from, created_to, competenceId, req
    } = params;
    const userCommuneId = req?.user?.communeId as number | undefined;

    const where: any = { id_parent: null };
    if (typeof regionId === 'number') where.regionId = regionId;
    if (typeof departementId === 'number') where.departementId = departementId;
    if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
    if (typeof communeId === 'number') where.communeId = communeId;
    if (typeof utilisateurId === 'number') where.utilisateurId = utilisateurId;
    if (typeof competenceId === 'number') where.competenceId = competenceId;

    // 🔒 Scope commune utilisateur prioritaire
    if (userCommuneId) where.communeId = userCommuneId;

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
          id: true, id_parent: true, id_type_infrastructure: true,
          typeRef: { select: { id: true, name: true, type: true, domaineId: true, sousdomaineId: true } },
          name: true, description: true, existing_infrastructure: true, type: true,
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

  /* ---------- CREATE (récursif avec héritage racine & type enfant possible) ---------- */
  async create(dto: CreateInfrastructureDto, currentUserId?: number) {
    await this.ensureTypeExists(dto.typeId);
    await this.ensureTerritoryExists(dto.regionId, dto.departementId, dto.arrondissementId, dto.communeId);
    await this.ensureClassification(dto.domaineId, dto.sousdomaineId);

    const creatorId = dto.utilisateurId ?? currentUserId ?? null;
    await this.ensureUserExists(creatorId ?? undefined);

    const parentFolder = `infrastructures/${dto.communeId}`;

    const normalizedComponents: any[] = [];
    for (const c of ensureArray(dto.composant)) {
      // en CREATE, "id" d’un composant peut être un TypeInfrastructure.id
      normalizedComponents.push(await this.normalizeComponentTree(c, `${parentFolder}/components`, 1, true));
    }

    const dataParent: any = {
      id_parent: null,
      id_type_infrastructure: dto.typeId,
      name: dto.name,
      description: dto.description ?? null,
      existing_infrastructure: dto.existing_infrastructure ?? true,
      type: dto.type ?? 'SIMPLE',
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
      composant: [],
    };

    const result = await this.prisma.$transaction(
      async (tx) => {
        const parent = await tx.infrastructure.create({ data: dataParent, select: { id: true } });

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

        const enrichedChildren: any[] = [];
        for (const comp of normalizedComponents) {
          enrichedChildren.push(await this.createComponentRecursive(tx, ctx, comp, parent.id));
        }

        if (enrichedChildren.length) {
          await tx.infrastructure.update({ where: { id: parent.id }, data: { composant: enrichedChildren }, select: { id: true } });
        }

        return { id: toStrId(parent.id), composants: enrichedChildren };
      },
      {
        maxWait: 20_000,   // attend un slot de transaction jusqu'à 20s
        timeout: 120_000,  // durée max de la transaction 120s
        // isolationLevel: 'ReadCommitted' as any, // optionnel selon besoin
      }
    );

    return result;
  }

  /* ===================== UPDATE (pro & synchronisation des composants) ===================== */

  private async deleteSubtree(tx: any, id: bigint): Promise<void> {
    const children = await tx.infrastructure.findMany({ where: { id_parent: id }, select: { id: true } });
    for (const ch of children) await this.deleteSubtree(tx, ch.id);
    await tx.infrastructure.delete({ where: { id } });
  }

  private async syncChildren(
    tx: any,
    ctx: {
      creatorId: number | null; typeId: number;
      regionId: number; departementId: number; arrondissementId: number; communeId: number;
      domaineId: number | null; sousdomaineId: number | null; competenceId: number | null;
      folder: string;
    },
    parentId: bigint,
    inputs: ComponentInput[],
    mode: 'merge'|'replace' = 'merge',
    depth = 1,
  ): Promise<any[]> {
    if (depth > InfrastructuresService.MAX_COMPONENT_DEPTH) {
      throw new BadRequestException({ message: `Profondeur de composants excessive.`, messageE: `Component depth too large.` });
    }

    const existing = await tx.infrastructure.findMany({
      where: { id_parent: parentId },
      select: {
        id: true, name: true, type: true, description: true,
        location: true, images: true, attribus: true,
      },
    }) as Array<{
      id: bigint; name: string; type: string; description: string | null;
      location: any; images: any; attribus: any;
    }>;
    const byId = new Map<string, typeof existing[number]>(existing.map(e => [toStrId(e.id), e]));
    const used = new Set<string>();
    const enriched: any[] = [];

    for (const raw of ensureArray(inputs)) {
      const cid = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;

      if (cid && byId.has(cid)) {
        // UPDATE existant
        used.add(cid);
        const row = byId.get(cid)!;

        const nextImages = raw.images !== undefined
          ? await this.toCloudinaryUrls(ensureArray(raw.images), `${ctx.folder}/components`)
          : undefined;

        let nextAttribus: any | undefined = undefined;
        if (raw.attribus !== undefined) {
          nextAttribus = deepMerge(row.attribus, raw.attribus);
        }

        let nextLocation: any | undefined = undefined;
        if (raw.location !== undefined) {
          nextLocation = deepMerge(row.location, raw.location);
        }

        await tx.infrastructure.update({
          where: { id: BigInt(cid) },
          data: {
            id_type_infrastructure: ctx.typeId,
            regionId: ctx.regionId, departementId: ctx.departementId,
            arrondissementId: ctx.arrondissementId, communeId: ctx.communeId,
            domaineId: ctx.domaineId, sousdomaineId: ctx.sousdomaineId, competenceId: ctx.competenceId,
            utilisateurId: ctx.creatorId,

            name: raw.name ?? row.name,
            description: raw.description === undefined ? row.description : (raw.description ?? null),
            type: (raw.type ?? row.type) === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',
            images: (nextImages as any) ?? (row.images as any),
            location: nextLocation ?? row.location,
            attribus: nextAttribus ?? row.attribus,
          },
          select: { id: true },
        });

        // recurse
        let childrenJson: any[] = [];
        if (raw.composant !== undefined) {
          childrenJson = await this.syncChildren(tx, ctx, BigInt(cid), raw.composant!, mode, depth + 1);
          await tx.infrastructure.update({ where: { id: BigInt(cid) }, data: { composant: childrenJson } });
        } else {
          const existed = await tx.infrastructure.findUnique({ where: { id: BigInt(cid) }, select: { composant: true } });
          childrenJson = ensureArray(existed?.composant);
        }

        enriched.push({
          id: cid,
          name: raw.name ?? row.name,
          type: (raw.type ?? row.type) === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',
          description: raw.description === undefined ? row.description : (raw.description ?? null),
          location: nextLocation ?? row.location,
          images: (nextImages as any) ?? (row.images as any),
          attribus: nextAttribus ?? row.attribus,
          composant: childrenJson,
        });

      } else {
        // CREATE nouveau (en UPDATE, "id" cible un enfant existant — ici on ne traite pas id comme typeRef)
        const norm = await this.normalizeComponentTree(raw, `${ctx.folder}/components`);
        const created = await this.createComponentRecursive(tx, ctx, norm, parentId, depth);
        enriched.push(created);
      }
    }

    if (mode === 'replace') {
      for (const e of existing) {
        const key = toStrId(e.id);
        if (!used.has(key)) {
          await this.deleteSubtree(tx, e.id);
        }
      }
    }

    return enriched;
  }

  async update(idStr: string, dto: UpdateInfrastructureDto) {
    const id = BigInt(idStr);
    const current = await this.prisma.infrastructure.findUnique({
      where: { id },
      select: {
        id: true, id_parent: true,
        id_type_infrastructure: true, name: true, description: true, type: true,
        existing_infrastructure: true,
        regionId: true, departementId: true, arrondissementId: true, communeId: true,
        domaineId: true, sousdomaineId: true, utilisateurId: true, competenceId: true,
        location: true, images: true, attribus: true,
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

    await this.ensureClassification(dto.domaineId ?? current.domaineId ?? undefined, dto.sousdomaineId ?? current.sousdomaineId ?? undefined);
    if (typeof dto.utilisateurId === 'number') await this.ensureUserExists(dto.utilisateurId);

    const folder = `infrastructures/${effCom}`;

    const nextImages = dto.images !== undefined
      ? await this.toCloudinaryUrls(ensureArray(dto.images), folder)
      : undefined;

    const attribusMode = (dto as any).attribus_mode ?? 'merge';
    const nextAttribus =
      dto.attribus === undefined
        ? undefined
        : (attribusMode === 'replace' ? ensureObject(dto.attribus) : deepMerge(current.attribus, dto.attribus));

    const nextLocation =
      dto.location === undefined
        ? undefined
        : deepMerge(current.location, dto.location);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.infrastructure.update({
        where: { id },
        data: {
          id_type_infrastructure: effTypeId,
          name: dto.name ?? current.name,
          description: dto.description === undefined ? current.description : (dto.description ?? null),
          existing_infrastructure: dto.existing_infrastructure ?? current.existing_infrastructure,
          type: (dto.type ?? current.type) === 'COMPLEXE' ? 'COMPLEXE' : 'SIMPLE',

          regionId: effRegion, departementId: effDep, arrondissementId: effArr, communeId: effCom,
          domaineId: dto.domaineId ?? current.domaineId,
          sousdomaineId: dto.sousdomaineId ?? current.sousdomaineId,
          competenceId: dto.competenceId ?? current.competenceId,
          utilisateurId: dto.utilisateurId ?? current.utilisateurId,

          images: (nextImages as any) ?? (current.images as any),
          location: nextLocation ?? current.location,
          attribus: nextAttribus ?? current.attribus,
        },
        select: { id: true },
      });

      if (dto.composant !== undefined) {
        const ctx = {
          creatorId: dto.utilisateurId ?? current.utilisateurId ?? null,
          typeId: effTypeId,
          regionId: effRegion, departementId: effDep, arrondissementId: effArr, communeId: effCom,
          domaineId: dto.domaineId ?? current.domaineId ?? null,
          sousdomaineId: dto.sousdomaineId ?? current.sousdomaineId ?? null,
          competenceId: dto.competenceId ?? current.competenceId ?? null,
          folder,
        };
        const newChildrenJson = await this.syncChildren(tx, ctx, id, dto.composant, (dto as any).composant_mode ?? 'merge');
        await tx.infrastructure.update({ where: { id }, data: { composant: newChildrenJson } });
      }

      const updated = await tx.infrastructure.findUnique({
        where: { id },
        select: {
          id: true, id_parent: true,
          id_type_infrastructure: true, name: true, description: true, type: true,
          regionId: true, departementId: true, arrondissementId: true, communeId: true,
          domaineId: true, sousdomaineId: true, utilisateurId: true, competenceId: true,
          location: true, images: true, attribus: true, composant: true, updated_at: true,
        },
      });

      return {
        ...updated!,
        id: toStrId(updated!.id),
        id_parent: updated!.id_parent ? toStrId(updated!.id_parent as any) : null,
      };
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
        id_parent: true,
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
          departement:   { select: { id: true, nom: true} },
          arrondissement:{ select: { id: true, nom: true } },
          commune:       { select: { id: true, nom: true } },
          competence:    { select: { id: true, name: true } },
        } : {}),
      },
    });
    if (!row) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

    return { ...row, id: toStrId(row.id), id_parent: row.id_parent ? toStrId(row.id_parent as any) : null };
  }

  /* ---------- DELETE (simple) ---------- */
  async remove(idStr: string) {
    const id = BigInt(idStr);
    const exists = await this.prisma.infrastructure.count({ where: { id } });
    if (!exists) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });
    await this.prisma.infrastructure.delete({ where: { id } });
  }

  /* ---------- EXPORT CSV (root only via list) ---------- */
  async exportCsv(params: Parameters<InfrastructuresService['list']>[0]) {
    const full = await this.list({ ...params, page: 1, pageSize: 100000, sort: params.sort });
    const headers = [
      'id','id_parent','name','description','type','existing_infrastructure',
      'id_type_infrastructure','regionId','departementId','arrondissementId','communeId',
      'domaineId','sousdomaineId','utilisateurId','competenceId','created_at','updated_at'
    ];
    const rows = full.items.map((r: any) => ([
      r.id, r.id_parent ?? '', r.name, r.description ?? '', r.type, r.existing_infrastructure ? 1 : 0,
      r.id_type_infrastructure, r.regionId, r.departementId, r.arrondissementId, r.communeId,
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

  /* ---------- Stats (ROOT-ONLY pour les totaux / groupements) ---------- */
  async statsSummary(q: Scope, req: any) {
    const where = rootOnly(applyUserCommune(buildWhere(q), req));

    const [total, simple, complexe] = await this.prisma.$transaction([
      this.prisma.infrastructure.count({ where }),
      this.prisma.infrastructure.count({ where: { ...where, type: 'SIMPLE' } }),
      this.prisma.infrastructure.count({ where: { ...where, type: 'COMPLEXE' } }),
    ]);

    const base = sqlWhereNumeric(where);
    const baseRoot = sqlWhereWithRoot(base);
    const etatExpr = etatExprSQL();
    const rows = await this.prisma.$queryRawUnsafe<Array<{ etat: string | null; c: any }>>(`
      SELECT ${etatExpr} AS etat, COUNT(*) AS c
      FROM Infrastructure i
      ${baseRoot}
      GROUP BY etat
      ORDER BY c DESC;
    `);

    const map = new Map<string, number>();
    for (const r of rows || []) {
      const k = (r.etat || '').toString().trim().toUpperCase();
      if (!k) continue;
      map.set(k, (map.get(k) ?? 0) + Number(r.c ?? 0));
    }
    const byEtat = (ALLOWED_ETATS as readonly string[]).map(e => ({ etat: e as Etat, count: map.get(e) ?? 0 }));

    return {
      message: 'Résumé des infrastructures.',
      messageE: 'Infrastructures summary.',
      data: { total, byType: { SIMPLE: simple, COMPLEXE: complexe }, byEtat },
    };
  }

  /** Groupements (type|region|departement|commune) — ROOT ONLY — option etats */
  async statsGroup(
    q: Scope & { group: 'type'|'region'|'departement'|'commune'; include_etat?: boolean; limit?: number },
    req: any,
  ) {
    const scoped = applyUserCommune(buildWhere(q), req);
    const where = rootOnly(scoped);
    const includeEtat = q.include_etat !== false;
    const limit = Number(q.limit ?? 50);

    const col =
      q.group === 'type'        ? 'id_type_infrastructure' :
      q.group === 'region'      ? 'regionId' :
      q.group === 'departement' ? 'departementId' :
                                  'communeId';

    const base = sqlWhereNumeric(where);
    const baseRoot = sqlWhereWithRoot(base);

    const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
      SELECT ${col} AS k, COUNT(*) AS c
      FROM Infrastructure i
      ${baseRoot}
      GROUP BY ${col}
      ORDER BY c DESC;
    `);

    const ids = totals.map(t => t.k).filter((v): v is number => typeof v === 'number');

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
      const etatExpr = etatExprSQL();
      etatRows = await this.prisma.$queryRawUnsafe(`
        SELECT ${col} AS k,
               ${etatExpr} AS etat,
               COUNT(*) AS c
        FROM Infrastructure i
        ${baseRoot}
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
          const bucket = new Map<string, number>();
          for (const r of etatRows || []) {
            if (r.k !== id) continue;
            const k = (r.etat || '').toString().toUpperCase();
            if (!k) continue;
            bucket.set(k, (bucket.get(k) ?? 0) + Number(r.c ?? 0));
          }
          etats = (ALLOWED_ETATS as readonly string[]).map(e => ({ etat: e as Etat, count: bucket.get(e) ?? 0 }));
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

  /** Groupements par competenceId / domaineId — ROOT ONLY (ordre décroissant) */
  async statsByDimension(
    dim: 'competence'|'domaine',
    q: Scope & { include_etat?: boolean; limit?: number },
    req: any,
  ) {
    const scoped = applyUserCommune(buildWhere(q), req);
    const where = rootOnly(scoped);
    const includeEtat = q.include_etat !== false;
    const limit = Number(q.limit ?? 50);

    const col = dim === 'competence' ? 'competenceId' : 'domaineId';
    const base = sqlWhereNumeric(where);
    const baseRoot = sqlWhereWithRoot(base);

    const totals = await this.prisma.$queryRawUnsafe<Array<{ k: number | null; c: any }>>(`
      SELECT ${col} AS k, COUNT(*) AS c
      FROM Infrastructure i
      ${baseRoot}
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
      const etatExpr = etatExprSQL();
      etatRows = await this.prisma.$queryRawUnsafe(`
        SELECT ${col} AS k,
               ${etatExpr} AS etat,
               COUNT(*) AS c
        FROM Infrastructure i
        ${baseRoot}
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
          const bucket = new Map<string, number>();
          for (const r of etatRows || []) {
            if (r.k !== id) continue;
            const k = (r.etat || '').toString().toUpperCase();
            if (!k) continue;
            bucket.set(k, (bucket.get(k) ?? 0) + Number(r.c ?? 0));
          }
          etats = (ALLOWED_ETATS as readonly string[]).map(e => ({ etat: e as Etat, count: bucket.get(e) ?? 0 }));
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

  /** Upload (base64 dataURL ou http) vers Cloudinary pour la preuve */
  private async toProofURL(input: string, folder: string): Promise<string> {
    if (typeof input !== 'string' || !input.trim()) {
      throw new BadRequestException({ message: 'Fichier justificatif requis.', messageE: 'Proof file required.' });
    }
    if (/^data:(image\/.+|application\/pdf);base64,/.test(input)) {
      return await uploadImageToCloudinary(input, folder);
    }
    if (/^https?:\/\//i.test(input)) return input;
    throw new BadRequestException({ message: 'Format de fichier non supporté.', messageE: 'Unsupported proof file format.' });
  }

  /** Récupère récursivement toute la sous-arborescence (parent + enfants n niveaux). */
  private async collectSubtreeRows(rootId: bigint) {
    const root = await this.prisma.infrastructure.findUnique({
      where: { id: rootId },
      select: infraFullSelect,
    });
    if (!root) throw new NotFoundException({ message: 'Infrastructure introuvable.', messageE: 'Infrastructure not found.' });

    const all: typeof root[] = [root];
    const levels: bigint[][] = [[rootId]];
    let idx = 0;

    while (idx < levels.length) {
      const parentIds = levels[idx];
      const children = await this.prisma.infrastructure.findMany({
        where: { id_parent: { in: parentIds } },
        select: infraFullSelect,
      });

      if (!children.length) break;
      all.push(...children);

      const nextLevelIds = children.map(c => c.id as bigint);
      levels.push(nextLevelIds);
      idx++;
    }

    return { root, all, levels };
  }

  /** Archive en masse dans DeletedInfrastructure puis suppression */
  async archiveAndDelete(idStr: string, body: DeleteInfrastructureDto) {
    if (!idStr) throw new BadRequestException({ message: 'ID requis.', messageE: 'ID required.' });
    const id = BigInt(idStr);

    const reason = (body?.reason ?? '').toString().trim();
    if (!reason) throw new BadRequestException({ message: 'Raison requise.', messageE: 'Reason required.' });

    const fileURL = await this.toProofURL(body.proofFile, `infrastructures/deleted/proofs`);

    const { all, levels } = await this.collectSubtreeRows(id);

    const res = await this.prisma.$transaction(
      async (tx) => {
        const archivedCount = await this.archiveRows(all as any, reason, fileURL, tx);

        for (let depth = levels.length - 1; depth >= 0; depth--) {
          const idsAtLevel = levels[depth];
          if (!idsAtLevel.length) continue;
          await tx.infrastructure.deleteMany({ where: { id: { in: idsAtLevel } } });
        }

        return { archivedCount, deletedCount: all.length, fileURL, reason };
      },
      {
        maxWait: 20_000,
        timeout: 180_000, // archivage + delete en profondeur peut être un peu plus long
      }
    );

    return res;
  }

  async listDeleted(params: {
    page: number; pageSize: number; sort?: Order;
    q?: string; type?: string; regionId?: number; departementId?: number; arrondissementId?: number; communeId?: number;
    typeId?: number; domaineId?: number; sousdomaineId?: number; competenceId?: number; utilisateurId?: number;
  }) {
    const {
      page, pageSize, sort, q, type,
      regionId, departementId, arrondissementId, communeId,
      typeId, domaineId, sousdomaineId, competenceId, utilisateurId,
    } = params;

    const where: any = {};
    if (q) {
      where.OR = [
        { name:        { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { reason:      { contains: q, mode: 'insensitive' } },
      ];
    }
    if (type) where.type = type;
    if (typeof regionId === 'number') where.regionId = regionId;
    if (typeof departementId === 'number') where.departementId = departementId;
    if (typeof arrondissementId === 'number') where.arrondissementId = arrondissementId;
    if (typeof communeId === 'number') where.communeId = communeId;
    if (typeof utilisateurId === 'number') where.utilisateurId = utilisateurId;
    if (typeof competenceId === 'number') where.competenceId = competenceId;
    if (typeof domaineId === 'number') where.domaineId = domaineId;
    if (typeof sousdomaineId === 'number') where.sousdomaineId = sousdomaineId;
    if (typeof typeId === 'number') where.id_type_infrastructure = typeId;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.deletedInfrastructure.count({ where }),
      this.prisma.deletedInfrastructure.findMany({
        where,
        orderBy: sort ?? { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, id_parent: true, id_type_infrastructure: true,
          name: true, description: true, existing_infrastructure: true, type: true,
          regionId: true, departementId: true, arrondissementId: true, communeId: true,
          domaineId: true, sousdomaineId: true, competenceId: true, utilisateurId: true,
          location: true, images: true, attribus: true, composant: true,
          created_at: true, updated_at: true,
          reason: true, fileURL: true,
        },
      }),
    ]);

    const items = rows.map(r => ({
      ...r,
      id: r.id.toString(),
      id_parent: r.id_parent ? r.id_parent.toString() : null,
    }));

    return { total, items };
  }

  async findOneDeleted(idStr: string) {
    const id = BigInt(idStr);
    const row = await this.prisma.deletedInfrastructure.findUnique({
      where: { id },
      select: {
        id: true, id_parent: true, id_type_infrastructure: true,
        name: true, description: true, existing_infrastructure: true, type: true,
        regionId: true, departementId: true, arrondissementId: true, communeId: true,
        domaineId: true, sousdomaineId: true, competenceId: true, utilisateurId: true,
        location: true, images: true, attribus: true, composant: true,
        created_at: true, updated_at: true,
        reason: true, fileURL: true,
      },
    });
    if (!row) {
      throw new NotFoundException({ message: 'Elément archivé introuvable.', messageE: 'Archived item not found.' });
    }
    return {
      ...row,
      id: row.id.toString(),
      id_parent: row.id_parent ? row.id_parent.toString() : null,
    };
  }

  /** Archive en masse (utilisé par archiveAndDelete) */
  private async archiveRows(rows: Array<any>, reason: string, fileURL: string, tx: any) {
    const data = rows.map(r => ({
      id: r.id as bigint,
      id_parent: r.id_parent as bigint | null,
      id_type_infrastructure: r.id_type_infrastructure,
      name: r.name,
      description: r.description,
      existing_infrastructure: r.existing_infrastructure,
      type: r.type,
      regionId: r.regionId,
      departementId: r.departementId,
      arrondissementId: r.arrondissementId,
      communeId: r.communeId,
      domaineId: r.domaineId,
      sousdomaineId: r.sousdomaineId,
      competenceId: r.competenceId,
      utilisateurId: r.utilisateurId,
      location: r.location as any,
      images: r.images as any,
      attribus: r.attribus as any,
      composant: r.composant as any,
      created_at: r.created_at,
      updated_at: r.updated_at,
      reason,
      fileURL,
    }));

    await tx.deletedInfrastructure.createMany({
      data,
      skipDuplicates: true,
    });

    return data.length;
  }
}
