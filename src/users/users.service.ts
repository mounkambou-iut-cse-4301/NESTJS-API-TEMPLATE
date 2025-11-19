// import * as bcrypt from 'bcryptjs';
// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import * as argon2 from 'argon2';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { uploadImageToCloudinary } from '../utils/cloudinary';
// import { EmailService } from 'src/utils/email.service';


// type Order = Record<string, 'asc' | 'desc'>;
// @Injectable()
// export class UsersService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly email: EmailService,
    
//   ) {}

//   /** Liste paginée des utilisateurs avec filtres. */
// //   async list(params: {
// //     page: number;
// //     pageSize: number;
// //     sort?: Record<string, 'asc' | 'desc'>;
// //     communeId?: number;
// //     is_verified?: boolean;
// //     is_block?: boolean;
// //     q?: string;
// //     req?: any; // pour le logging
// //   }) {
// //     const { page, pageSize, sort, communeId, is_verified, is_block, q, req } = params;
// //     const currentUserId = req?.sub as number | undefined;
// //     const userCommuneId = req?.user.communeId as number | undefined;

// //     const where: any = {};
// //     if (typeof communeId === 'number') where.communeId = communeId;
// //     if (typeof is_verified === 'boolean') where.is_verified = is_verified;
// //     if (typeof is_block === 'boolean') where.is_block = is_block;
// //     if (q) {
// //       where.OR = [
// //         { nom:       { contains: q, mode: 'insensitive' } },
// //         { email:     { contains: q, mode: 'insensitive' } },
// //         { telephone: { contains: q, mode: 'insensitive' } },
// //       ];
// //     }

// //     const [total, items] = await this.prisma.$transaction([
// //       this.prisma.utilisateur.count({ where }),
// //       this.prisma.utilisateur.findMany({
// //         where,
// //         orderBy: (sort as any) ?? { created_at: 'desc' },
// //         skip: (page - 1) * pageSize,
// //         take: pageSize,
// //         select: {
// //           id: true,
// //           nom: true,
// //           email: true,
// //           telephone: true,
// //           communeId: true,
// //           is_verified: true,
// //           is_block: true,
// //           created_at: true,
// //           updated_at: true,
// //           // Rôles si relation présente
// //           roles: { select: { role: { select: { id: true, nom: true } } } },
// //         },
// //       }),
// //     ]);

// //     return { total, items };
// //   }
// async list(params: {
//   page: number;
//   pageSize: number;
//   sort?: Record<string, 'asc' | 'desc'>;
//   communeId?: number;
//   is_verified?: boolean;
//   is_block?: boolean;
//   q?: string;
//   req?: any; // pour le logging
// }) {
//   const { page, pageSize, sort, communeId, is_verified, is_block, q, req } = params;
//   const currentUserId = req?.sub as number | undefined;
//   const userCommuneId = req?.user.communeId as number | undefined;

//   const where: any = {};

//   // Filtrage par commune
//   if (userCommuneId !== undefined && userCommuneId !== null) {
//     where.communeId = userCommuneId;
//   } else if (typeof communeId === 'number') {
//     where.communeId = communeId;
//   }

//   // Autres filtres
//   if (typeof is_verified === 'boolean') where.is_verified = is_verified;
//   if (typeof is_block === 'boolean') where.is_block = is_block;
//   if (q) {
//     where.OR = [
//       { nom: { contains: q, mode: 'insensitive' } },
//       { email: { contains: q, mode: 'insensitive' } },
//       { telephone: { contains: q, mode: 'insensitive' } },
//     ];
//   }

//   const [total, items] = await this.prisma.$transaction([
//     this.prisma.utilisateur.count({ where }),
//     this.prisma.utilisateur.findMany({
//       where,
//       orderBy: (sort as any) ?? { created_at: 'desc' },
//       skip: (page - 1) * pageSize,
//       take: pageSize,
//       select: {
//         id: true,
//         nom: true,
//         email: true,
//         telephone: true,
//         communeId: true,
//         is_verified: true,
//         is_block: true,
//         created_at: true,
//         updated_at: true,
//         // Rôles si relation présente
//         roles: { select: { role: { select: { id: true, nom: true } } } },
//       },
//     }),
//   ]);

//   return { total, items };
// }
//   /**
//    * Création d'un utilisateur.
//    * - téléphone OBLIGATOIRE & UNIQUE, commence par +237
//    * - hash du mot de passe (argon2)
//    * - upload image Cloudinary si base64
//    * - email texte FR/EN
//    */

// // async create(dto: CreateUserDto) {
// //   // Téléphone : obligatoire +237 + unicité
// //   if (!dto.telephone) {
// //     throw new BadRequestException({
// //       message: 'Le numéro de téléphone est obligatoire.',
// //       messageE: 'Phone number is required.',
// //     });
// //   }
// //   if (!dto.telephone.startsWith('+237')) {
// //     throw new BadRequestException({
// //       message: 'Numéro de téléphone invalide (doit commencer par +237).',
// //       messageE: 'Invalid phone number (must start with +237).',
// //     });
// //   }
// //   const telExists = await this.prisma.utilisateur.findUnique({
// //     where: { telephone: dto.telephone },
// //     select: { id: true },
// //   });
// //   if (telExists) {
// //     throw new BadRequestException({
// //       message: 'Numéro de téléphone déjà utilisé.',
// //       messageE: 'Phone number already in use.',
// //     });
// //   }

// //   // Email unique
// //   const emailExists = await this.prisma.utilisateur.findUnique({
// //     where: { email: dto.email },
// //     select: { id: true },
// //   });
// //   if (emailExists) {
// //     throw new BadRequestException({
// //       message: 'Adresse email déjà utilisée.',
// //       messageE: 'Email already in use.',
// //     });
// //   }

// //   let photoUrl: string | undefined;
// //   if (dto.photoBase64) {
// //     photoUrl = await uploadImageToCloudinary(dto.photoBase64, 'users');
// //   }

// //   // ✅ bcrypt
// //   const hash = await bcrypt.hash(dto.mot_de_passe, 10);

// //   try {
// //     const data: any = {
// //       nom: dto.nom,
// //       email: dto.email,
// //       mot_de_passe: hash,
// //       telephone: dto.telephone,
// //       communeId: dto.communeId ?? null,
// //       ville: dto.ville ?? null,
// //       adresse: dto.adresse ?? null,
// //       is_verified: dto.is_verified ?? false,
// //       is_block: dto.is_block ?? false,
// //     };
// //     if (photoUrl) data.photo_url = photoUrl;

// //     const created = await this.prisma.utilisateur.create({
// //       data,
// //       select: { id: true, nom: true, email: true, telephone: true },
// //     });

// //     const subject = 'SIGCOM - Compte créé / Account created';
// //     const message =
// // `SIGCOM — Compte créé

// // Bonjour ${created.nom},
// // Votre compte a été créé avec succès sur SIGCOM.
// // Email : ${created.email}
// // Téléphone : ${created.telephone}
// // Merci de changer votre mot de passe à la première connexion.

// // ---
// // Account created

// // Hello ${created.nom},
// // Your account has been successfully created on SIGCOM.
// // Email: ${created.email}
// // Phone: ${created.telephone}
// // Please change your password at first login.
// // `;
// //     await this.email.sendEmail(subject, message, created.email);

// //     return created;
// //   } catch (e: any) {
// //     if (e.code === 'P2002') {
// //       throw new BadRequestException({
// //         message: 'Contrainte d’unicité violée (email ou téléphone).',
// //         messageE: 'Unique constraint failed (email or phone).',
// //       });
// //     }
// //     throw e;
// //   }}

// async create(dto: CreateUserDto) {
//     // 1) Vérifs téléphone
//     if (!dto.telephone) {
//       throw new BadRequestException({
//         message: 'Le numéro de téléphone est obligatoire.',
//         messageE: 'Phone number is required.',
//       });
//     }
//     if (!dto.telephone.startsWith('+237')) {
//       throw new BadRequestException({
//         message: 'Numéro de téléphone invalide (doit commencer par +237).',
//         messageE: 'Invalid phone number (must start with +237).',
//       });
//     }
//     const telExists = await this.prisma.utilisateur.findUnique({
//       where: { telephone: dto.telephone },
//       select: { id: true },
//     });
//     if (telExists) {
//       throw new BadRequestException({
//         message: 'Numéro de téléphone déjà utilisé.',
//         messageE: 'Phone number already in use.',
//       });
//     }

//     // 2) Email unique
//     const emailExists = await this.prisma.utilisateur.findUnique({
//       where: { email: dto.email },
//       select: { id: true },
//     });
//     if (emailExists) {
//       throw new BadRequestException({
//         message: 'Adresse email déjà utilisée.',
//         messageE: 'Email already in use.',
//       });
//     }

//     // 3) Upload éventuel de la photo
//     let photoUrl: string | undefined;
//     if (dto.photoBase64) {
//       photoUrl = await uploadImageToCloudinary(dto.photoBase64, 'users');
//     }

//     // 4) Hash bcrypt
//     const hash = await bcrypt.hash(dto.mot_de_passe, 10);

//     // 5) Transaction: create user (+ user-role si roleId fourni)
//     try {
//       const created = await this.prisma.$transaction(async (tx) => {
//         const user = await tx.utilisateur.create({
//           data: {
//             nom: dto.nom,
//             email: dto.email,
//             mot_de_passe: hash,
//             telephone: dto.telephone,
//             communeId: dto.communeId ?? null,
//             // champs libres si présents en DB
//             ville: dto.ville ?? null,
//             adresse: dto.adresse ?? null,
//             is_verified: dto.is_verified ?? false,
//             is_block: dto.is_block ?? false,
//             ...(photoUrl ? { photo_url: photoUrl } : {}),
//           },
//           select: { id: true, nom: true, email: true, telephone: true },
//         });

//         // 👉 Si roleId est fourni: vérifier qu’il existe puis créer UtilisateurRole
//         if (dto.roleId !== undefined && dto.roleId !== null) {
//           const roleExists = await tx.role.count({ where: { id: dto.roleId } });
//           if (!roleExists) {
//             throw new BadRequestException({
//               message: 'Rôle invalide.',
//               messageE: 'Invalid role.',
//             });
//           }
//           await tx.utilisateurRole.create({
//             data: { utilisateurId: user.id, roleId: dto.roleId },
//           });
//         }

//         return user;
//       });

//       // 6) Email d’info (hors transaction)
//       const subject = 'SIGCOM - Compte créé / Account created';
//       const message =
// `SIGCOM — Compte créé

// Bonjour ${created.nom},
// Votre compte a été créé avec succès sur SIGCOM.
// Email : ${created.email}
// Téléphone : ${created.telephone}
// Merci de changer votre mot de passe à la première connexion.

// ---
// Account created

// Hello ${created.nom},
// Your account has been successfully created on SIGCOM.
// Email: ${created.email}
// Phone: ${created.telephone}
// Please change your password at first login.
// `;
//       await this.email.sendEmail(subject, message, created.email);

//       return created;
//     } catch (e: any) {
//       if (e?.code === 'P2002') {
//         // unique index fail (email ou téléphone)
//         throw new BadRequestException({
//           message: 'Contrainte d’unicité violée (email ou téléphone).',
//           messageE: 'Unique constraint failed (email or phone).',
//         });
//       }
//       throw e;
//     }
//   }
//   /** Récupération d'un utilisateur. */
//   async findOne(id: number) {
//     const user = await this.prisma.utilisateur.findUnique({
//       where: { id },
//       select: {
//         id: true,
//         nom: true,
//         email: true,
//         telephone: true,
//         communeId: true,
//         commune: { select: { id: true, nom: true,nom_en:true,arrondissement:true,departement:true,region:true,typeCommune:true } },
//         ville: true,
//         adresse: true,
//         is_verified: true,
//         is_block: true,
//         created_at: true,
//         updated_at: true,
//         roles: { select: { role: { select: { id: true, nom: true } } } },
//       },
//     });
//     if (!user) {
//       throw new NotFoundException({
//         message: 'Utilisateur introuvable.',
//         messageE: 'User not found.',
//       });
//     }
//     return user;
//   }

//   /**
//    * Mise à jour d'un utilisateur.
//    * - si telephone fourni : format + unicité (hors lui-même)
//    * - re-hash si mot_de_passe fourni
//    * - upload image Cloudinary si base64
//    */
//   async update(id: number, dto: UpdateUserDto) {
//     await this.ensureExists(id);

//     if (dto.telephone) {
//       if (!dto.telephone.startsWith('+237')) {
//         throw new BadRequestException({
//           message: 'Numéro de téléphone invalide (doit commencer par +237).',
//           messageE: 'Invalid phone number (must start with +237).',
//         });
//       }
//       const telOwner = await this.prisma.utilisateur.findUnique({
//         where: { telephone: dto.telephone },
//         select: { id: true },
//       });
//       if (telOwner && telOwner.id !== id) {
//         throw new BadRequestException({
//           message: 'Numéro de téléphone déjà utilisé.',
//           messageE: 'Phone number already in use.',
//         });
//       }
//     }

//     if (dto.email) {
//       const mailOwner = await this.prisma.utilisateur.findUnique({
//         where: { email: dto.email },
//         select: { id: true },
//       });
//       if (mailOwner && mailOwner.id !== id) {
//         throw new BadRequestException({
//           message: 'Adresse email déjà utilisée.',
//           messageE: 'Email already in use.',
//         });
//       }
//     }

//     let photoUrl: string | undefined;
//     if (dto.photoBase64) {
//       photoUrl = await uploadImageToCloudinary(dto.photoBase64, 'users');
//     }

//     const data: any = {
//       nom: dto.nom,
//       email: dto.email,
//       telephone: dto.telephone,
//       communeId: dto.communeId,
//       ville: dto.ville,
//       adresse:dto.adresse,
//       is_verified: dto.is_verified,
//       is_block: dto.is_block,
//     };
//     if (dto.mot_de_passe) data.mot_de_passe = await argon2.hash(dto.mot_de_passe);
//     if (photoUrl) data.photo_url = photoUrl;

//     try {
//       const updated = await this.prisma.utilisateur.update({
//         where: { id },
//         data,
//         select: {
//           id: true,
//           nom: true,
//           email: true,
//           telephone: true,
//           communeId: true,
//           is_verified: true,
//           is_block: true,
//           updated_at: true,
//         },
//       });
//       return updated;
//     } catch (e: any) {
//       if (e.code === 'P2002') {
//         throw new BadRequestException({
//           message: 'Contrainte d’unicité violée (email ou téléphone).',
//           messageE: 'Unique constraint failed (email or phone).',
//         });
//       }
//       throw e;
//     }
//   }

//   /** Suppression d'un utilisateur. */
//   async remove(id: number) {
//     await this.ensureExists(id);
//     await this.prisma.utilisateur.delete({ where: { id } });
//   }

//   private async ensureExists(id: number) {
//     const count = await this.prisma.utilisateur.count({ where: { id } });
//     if (!count) {
//       throw new NotFoundException({
//         message: 'Utilisateur introuvable.',
//         messageE: 'User not found.',
//       });
//     }
//   }

//   /** Dashboard pour l'utilisateur courant (via req.user / req.sub) */
//   async dashboard(id: number) {

//     const userId = id;
//     console.log("userId:", userId);

//     if (!userId) {
//       throw new BadRequestException({
//         message: 'Utilisateur non identifié.',
//         messageE: 'User not identified.',
//       });
//     }

//     // 1) Total créé par cet utilisateur
//     const total = await this.prisma.infrastructure.count({
//       where: { utilisateurId: userId },
//     });

//     if (!total) {
//       // Aucun enregistrement → pas de dernier jour
//       return {
//         total_infrastructures: 0,
//         last_day: null,
//         last_day_count: 0,
//       };
//     }

//     // 2) Dernier created_at
//     const lastRow = await this.prisma.infrastructure.findFirst({
//       where: { utilisateurId: userId },
//       orderBy: { created_at: 'desc' },
//       select: { created_at: true },
//     });

//     if (!lastRow?.created_at) {
//       return {
//         total_infrastructures: total,
//         last_day: null,
//         last_day_count: 0,
//       };
//     }

//     // On calcule le "jour" (YYYY-MM-DD) du dernier enregistrement
//     const lastDay = lastRow.created_at.toISOString().slice(0, 10);

//     // 3) Combien ce jour-là — on fait le comptage au niveau SQL par DATE() pour éviter les surprises de timezone
//     const rows: any[] = await this.prisma.$queryRawUnsafe(`
//       SELECT COUNT(*) AS c
//       FROM Infrastructure
//       WHERE utilisateurId = ${Number(userId)}
//         AND DATE(created_at) = DATE('${lastDay}')
//     `);
//     const lastDayCount = Number(rows?.[0]?.c ?? 0);

//     return {
//       total_infrastructures: total,
//       last_day: lastDay,
//       last_day_count: lastDayCount,
//     };
//   }

//   async listByRole(
//     roleName: 'ADMIN' | 'MINDEVEL' | 'AGENT' | 'SUPER ADMIN',
//     params: {
//       page: number;
//       pageSize: number;
//       sort?: Order;
//       communeId?: number;
//       is_verified?: boolean;
//       is_block?: boolean;
//       q?: string;
//       req?: any;
//     },
//   ) {
//     const { page, pageSize, sort, communeId, is_verified, is_block, q, req } = params;

//     const userCommuneId = req?.user?.communeId as number | undefined;

//     const where: any = {
//       // filtre par rôle (liaison Utilisateur.roles -> Role.nom)
//       roles: { some: { role: { is: { nom: roleName } } } },
//     };

//     // Portée de commune : d’abord celle du user connecté (si définie), sinon communeId de la query
//     if (typeof userCommuneId === 'number') where.communeId = userCommuneId;
//     else if (typeof communeId === 'number') where.communeId = communeId;

//     if (typeof is_verified === 'boolean') where.is_verified = is_verified;
//     if (typeof is_block === 'boolean') where.is_block = is_block;

//     if (q) {
//       where.OR = [
//         { nom: { contains: q, mode: 'insensitive' } },
//         { email: { contains: q, mode: 'insensitive' } },
//         { telephone: { contains: q, mode: 'insensitive' } },
//       ];
//     }

//     const [total, items] = await this.prisma.$transaction([
//       this.prisma.utilisateur.count({ where }),
//       this.prisma.utilisateur.findMany({
//         where,
//         orderBy: (sort as any) ?? { created_at: 'desc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true,
//           nom: true,
//           email: true,
//           telephone: true,
//           communeId: true,
//           is_verified: true,
//           is_block: true,
//           created_at: true,
//           updated_at: true,
//           roles: { select: { role: { select: { id: true, nom: true } } } },
//         },
//       }),
//     ]);

//     return { total, items };
//   }
// }
import * as bcrypt from 'bcryptjs';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { EmailService } from 'src/utils/email.service';

type Order = Record<string, 'asc' | 'desc'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async list(params: {
    page: number;
    pageSize: number;
    sort?: Record<string, 'asc' | 'desc'>;
    communeId?: number;
    is_verified?: boolean;
    is_block?: boolean;
    q?: string;
    req?: any;
  }) {
    const { page, pageSize, sort, communeId, is_verified, is_block, q, req } = params;
    const userCommuneId = req?.user?.communeId as number | undefined;

    const where: any = {};

    if (typeof userCommuneId === 'number') {
      where.communeId = userCommuneId;
    } else if (typeof communeId === 'number') {
      where.communeId = communeId;
    }

    if (typeof is_verified === 'boolean') where.is_verified = is_verified;
    if (typeof is_block === 'boolean') where.is_block = is_block;
    if (q) {
      where.OR = [
        { nom: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { telephone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.utilisateur.count({ where }),
      this.prisma.utilisateur.findMany({
        where,
        orderBy: (sort as any) ?? { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          nom: true,
          email: true,
          telephone: true,
          communeId: true,
          is_verified: true,
          is_block: true,
          created_at: true,
          updated_at: true,
          roles: { select: { role: { select: { id: true, nom: true } } } },
        },
      }),
    ]);

    return { total, items };
  }

//  async create(dto: CreateUserDto) {
//   if (!dto.telephone) {
//     throw new BadRequestException({
//       message: 'Le numéro de téléphone est obligatoire.',
//       messageE: 'Phone number is required.',
//     });
//   }
//   if (!dto.telephone.startsWith('+237')) {
//     throw new BadRequestException({
//       message: 'Numéro de téléphone invalide (doit commencer par +237).',
//       messageE: 'Invalid phone number (must start with +237).',
//     });
//   }
//   const telExists = await this.prisma.utilisateur.findUnique({
//     where: { telephone: dto.telephone },
//     select: { id: true },
//   });
//   if (telExists) {
//     throw new BadRequestException({
//       message: 'Numéro de téléphone déjà utilisé.',
//       messageE: 'Phone number already in use.',
//     });
//   }

//   const emailExists = await this.prisma.utilisateur.findUnique({
//     where: { email: dto.email },
//     select: { id: true },
//   });
//   if (emailExists) {
//     throw new BadRequestException({
//       message: 'Adresse email déjà utilisée.',
//       messageE: 'Email already in use.',
//     });
//   }

//   let photoUrl: string | undefined;
//   if (dto.photoBase64) {
//     // ---------- Cloudinary disabled ----------
//     // Avant : photoUrl = await uploadImageToCloudinary(dto.photoBase64, 'users');
//     // Pour désactiver Cloudinary sans supprimer le code, la ligne ci-dessus est commentée.
//     // Comportement actuel : on sauvegarde la valeur fournie telle quelle (ex: URL ou string).
//     photoUrl = dto.photoBase64 as unknown as string;
//   }

//   const hash = await bcrypt.hash(dto.mot_de_passe, 10);

//   try {
//     const created = await this.prisma.$transaction(async (tx) => {
//       const user = await tx.utilisateur.create({
//         data: {
//           nom: dto.nom,
//           email: dto.email,
//           mot_de_passe: hash,
//           telephone: dto.telephone,
//           communeId: dto.communeId ?? null,
//           ville: dto.ville ?? null,
//           adresse: dto.adresse ?? null,
//           is_verified: dto.is_verified ?? false,
//           is_block: dto.is_block ?? false,
//           ...(photoUrl ? { photo_url: photoUrl } : {}),
//         },
//         select: { id: true, nom: true, email: true, telephone: true },
//       });

//       if (dto.roleId !== undefined && dto.roleId !== null) {
//         const roleExists = await tx.role.count({ where: { id: dto.roleId } });
//         if (!roleExists) {
//           throw new BadRequestException({
//             message: 'Rôle invalide.',
//             messageE: 'Invalid role.',
//           });
//         }
//         await tx.utilisateurRole.create({
//           data: { utilisateurId: user.id, roleId: dto.roleId },
//         });
//       }

//       return user;
//     });

//     const subject = 'SIGCOM - Compte créé / Account created';
//     const message =
// `SIGCOM — Compte créé

// Bonjour ${created.nom},
// Votre compte a été créé avec succès sur SIGCOM.
// Email : ${created.email}
// Téléphone : ${created.telephone}
// Merci de changer votre mot de passe à la première connexion.

// ---
// Account created

// Hello ${created.nom},
// Your account has been successfully created on SIGCOM.
// Email: ${created.email}
// Phone: ${created.telephone}
// Please change your password at first login.
// `;
//     await this.email.sendEmail(subject, message, created.email);

//     return created;
//   } catch (e: any) {
//     if (e?.code === 'P2002') {
//       throw new BadRequestException({
//         message: 'Contrainte d’unicité violée (email ou téléphone).',
//         messageE: 'Unique constraint failed (email or phone).',
//       });
//     }
//     throw e;
//   }
// }

async create(dto: CreateUserDto) {
    if (!dto.telephone) {
      throw new BadRequestException({ message: 'Le numéro de téléphone est obligatoire.' });
    }
    if (!dto.telephone.startsWith('+237')) {
      throw new BadRequestException({ message: 'Numéro de téléphone invalide (doit commencer par +237).' });
    }

    const telExists = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
      select: { id: true },
    });
    if (telExists) throw new BadRequestException({ message: 'Numéro de téléphone déjà utilisé.' });

    const emailExists = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (emailExists) throw new BadRequestException({ message: 'Adresse email déjà utilisée.' });

    const hash = await bcrypt.hash(dto.mot_de_passe, 10);
    const photoUrl = dto.photoBase64 ? (dto.photoBase64 as unknown as string) : undefined;

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        // Advisory lock (transaction-scoped) - choose a stable numeric key.
        // Change 987654321 to any integer unique to this lock in your app.
        await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock($1)', 987654321);

        // Find last id in transaction
        const last = await tx.utilisateur.findFirst({
          orderBy: { id: 'desc' },
          select: { id: true },
        });
        const nextId = (last?.id ?? 0) + 1;

        // Create user forcing id
        const user = await tx.utilisateur.create({
          data: {
            id: nextId,
            nom: dto.nom,
            email: dto.email,
            mot_de_passe: hash,
            telephone: dto.telephone,
            communeId: dto.communeId ?? null,
            ville: dto.ville ?? null,
            adresse: dto.adresse ?? null,
            is_verified: dto.is_verified ?? false,
            is_block: dto.is_block ?? false,
            ...(photoUrl ? { photo_url: photoUrl } : {}),
          },
          select: { id: true, nom: true, email: true, telephone: true },
        });

        if (dto.roleId !== undefined && dto.roleId !== null) {
          const roleExists = await tx.role.count({ where: { id: dto.roleId } });
          if (!roleExists) throw new BadRequestException({ message: 'Rôle invalide.' });
          await tx.utilisateurRole.create({ data: { utilisateurId: user.id, roleId: dto.roleId } });
        }

        return user;
      });

      // send email (optionnel)
      const subject = 'SIGCOM - Compte créé / Account created';
      const message = `Bonjour ${created.nom},\nVotre compte a été créé. Email: ${created.email}`;
      await this.email.sendEmail(subject, message, created.email);

      return created;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException({ message: 'Contrainte d’unicité violée (email ou téléphone).' });
      }
      throw e;
    }
  }

  async findOne(id: number) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        communeId: true,
        commune: { select: { id: true, nom: true, nom_en: true, arrondissement: true, departement: true, region: true, typeCommune: true } },
        ville: true,
        adresse: true,
        is_verified: true,
        is_block: true,
        created_at: true,
        updated_at: true,
        roles: { select: { role: { select: { id: true, nom: true } } } },
      },
    });
    if (!user) {
      throw new NotFoundException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }
    return user;
  }

 async update(id: number, dto: UpdateUserDto) {
  await this.ensureExists(id);

  if (dto.telephone) {
    if (!dto.telephone.startsWith('+237')) {
      throw new BadRequestException({
        message: 'Numéro de téléphone invalide (doit commencer par +237).',
        messageE: 'Invalid phone number (must start with +237).',
      });
    }
    const telOwner = await this.prisma.utilisateur.findUnique({
      where: { telephone: dto.telephone },
      select: { id: true },
    });
    if (telOwner && telOwner.id !== id) {
      throw new BadRequestException({
        message: 'Numéro de téléphone déjà utilisé.',
        messageE: 'Phone number already in use.',
      });
    }
  }

  if (dto.email) {
    const mailOwner = await this.prisma.utilisateur.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (mailOwner && mailOwner.id !== id) {
      throw new BadRequestException({
        message: 'Adresse email déjà utilisée.',
        messageE: 'Email already in use.',
      });
    }
  }

  let photoUrl: string | undefined;
  if (dto.photoBase64) {
    // ---------- Cloudinary disabled ----------
    // Avant : photoUrl = await uploadImageToCloudinary(dto.photoBase64, 'users');
    // La ligne Cloudinary est commentée ci-dessus.
    // Désormais : on sauvegarde directement la valeur reçue (URL ou string) dans photoUrl.
    photoUrl = dto.photoBase64 as unknown as string;
  }

  const data: any = {
    nom: dto.nom,
    email: dto.email,
    telephone: dto.telephone,
    communeId: dto.communeId,
    ville: dto.ville,
    adresse: dto.adresse,
    is_verified: dto.is_verified,
    is_block: dto.is_block,
  };
  if (dto.mot_de_passe) data.mot_de_passe = await argon2.hash(dto.mot_de_passe);
  if (photoUrl) data.photo_url = photoUrl;

  try {
    const updated = await this.prisma.utilisateur.update({
      where: { id },
      data,
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        communeId: true,
        is_verified: true,
        is_block: true,
        updated_at: true,
      },
    });
    return updated;
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw new BadRequestException({
        message: 'Contrainte d’unicité violée (email ou téléphone).',
        messageE: 'Unique constraint failed (email or phone).',
      });
    }
    throw e;
  }
}

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.utilisateur.delete({ where: { id } });
  }

  private async ensureExists(id: number) {
    const count = await this.prisma.utilisateur.count({ where: { id } });
    if (!count) {
      throw new NotFoundException({
        message: 'Utilisateur introuvable.',
        messageE: 'User not found.',
      });
    }
  }

  /** Dashboard pour l'utilisateur courant */
   async dashboard(id: number) {
    const userId = id;
    if (!userId) {
      throw new BadRequestException({
        message: 'Utilisateur non identifié.',
        messageE: 'User not identified.',
      });
    }

    const total = await this.prisma.infrastructure.count({
      where: { utilisateurId: userId,id_parent:null },
    });

    if (!total) {
      return {
        total_infrastructures: 0,
        last_day: null,
        last_day_count: 0,
      };
    }

    const lastRow = await this.prisma.infrastructure.findFirst({
      where: { utilisateurId: userId },
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    });

    if (!lastRow?.created_at) {
      return {
        total_infrastructures: total,
        last_day: null,
        last_day_count: 0,
      };
    }

    const lastDay = lastRow.created_at.toISOString().slice(0, 10);

    // PostgreSQL paramétré et identifiants quotés
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT COUNT(*) AS c
      FROM "Infrastructure"
      WHERE "utilisateurId" = ${Number(userId)}
        AND DATE("created_at") = DATE(${lastDay})
        AND "id_parent" IS NULL
    `;
    const lastDayCount = Number(rows?.[0]?.c ?? 0);

    return {
      total_infrastructures: total,
      last_day: lastDay,
      last_day_count: lastDayCount,
    };
  }

  async listByRole(
    roleName: 'ADMIN' | 'MINDEVEL' | 'AGENT' | 'SUPER ADMIN',
    params: {
      page: number;
      pageSize: number;
      sort?: Order;
      communeId?: number;
      is_verified?: boolean;
      is_block?: boolean;
      q?: string;
      req?: any;
    },
  ) {
    const { page, pageSize, sort, communeId, is_verified, is_block, q, req } = params;
    const userCommuneId = req?.user?.communeId as number | undefined;

    const where: any = {
      roles: { some: { role: { is: { nom: roleName } } } },
    };

    if (typeof userCommuneId === 'number') where.communeId = userCommuneId;
    else if (typeof communeId === 'number') where.communeId = communeId;

    if (typeof is_verified === 'boolean') where.is_verified = is_verified;
    if (typeof is_block === 'boolean') where.is_block = is_block;

    if (q) {
      where.OR = [
        { nom: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { telephone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.utilisateur.count({ where }),
      this.prisma.utilisateur.findMany({
        where,
        orderBy: (sort as any) ?? { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          nom: true,
          email: true,
          telephone: true,
          communeId: true,
          is_verified: true,
          is_block: true,
          created_at: true,
          updated_at: true,
          roles: { select: { role: { select: { id: true, nom: true } } } },
        },
      }),
    ]);

    return { total, items };
  }
}
