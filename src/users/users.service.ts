import * as bcrypt from 'bcryptjs';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import { EmailService } from 'src/utils/email.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    
  ) {}

  /** Liste paginée des utilisateurs avec filtres. */
//   async list(params: {
//     page: number;
//     pageSize: number;
//     sort?: Record<string, 'asc' | 'desc'>;
//     communeId?: number;
//     is_verified?: boolean;
//     is_block?: boolean;
//     q?: string;
//     req?: any; // pour le logging
//   }) {
//     const { page, pageSize, sort, communeId, is_verified, is_block, q, req } = params;
//     const currentUserId = req?.sub as number | undefined;
//     const userCommuneId = req?.user.communeId as number | undefined;

//     const where: any = {};
//     if (typeof communeId === 'number') where.communeId = communeId;
//     if (typeof is_verified === 'boolean') where.is_verified = is_verified;
//     if (typeof is_block === 'boolean') where.is_block = is_block;
//     if (q) {
//       where.OR = [
//         { nom:       { contains: q, mode: 'insensitive' } },
//         { email:     { contains: q, mode: 'insensitive' } },
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
//           // Rôles si relation présente
//           roles: { select: { role: { select: { id: true, nom: true } } } },
//         },
//       }),
//     ]);

//     return { total, items };
//   }
async list(params: {
  page: number;
  pageSize: number;
  sort?: Record<string, 'asc' | 'desc'>;
  communeId?: number;
  is_verified?: boolean;
  is_block?: boolean;
  q?: string;
  req?: any; // pour le logging
}) {
  const { page, pageSize, sort, communeId, is_verified, is_block, q, req } = params;
  const currentUserId = req?.sub as number | undefined;
  const userCommuneId = req?.user.communeId as number | undefined;

  const where: any = {};

  // Filtrage par commune
  if (userCommuneId !== undefined && userCommuneId !== null) {
    where.communeId = userCommuneId;
  } else if (typeof communeId === 'number') {
    where.communeId = communeId;
  }

  // Autres filtres
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
        // Rôles si relation présente
        roles: { select: { role: { select: { id: true, nom: true } } } },
      },
    }),
  ]);

  return { total, items };
}
  /**
   * Création d'un utilisateur.
   * - téléphone OBLIGATOIRE & UNIQUE, commence par +237
   * - hash du mot de passe (argon2)
   * - upload image Cloudinary si base64
   * - email texte FR/EN
   */
//   async create(dto: CreateUserDto) {
//     // Vérifications téléphone (obligatoire + format + unicité)
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

//     // Vérif email unique (en plus de la contrainte DB)
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

//     let photoUrl: string | undefined;
//     if (dto.photoBase64) {
//       photoUrl = await uploadImageToCloudinary(dto.photoBase64, 'users');
//     }

//     const hash = await argon2.hash(dto.mot_de_passe);

//     try {
//       const data: any = {
//         nom: dto.nom,
//         email: dto.email,
//         mot_de_passe: hash,
//         telephone: dto.telephone,
//         communeId: dto.communeId ?? null,
//         is_verified: dto.is_verified ?? false,
//         is_block: dto.is_block ?? false,
//       };
//       if (photoUrl) data.photo_url = photoUrl; // champ optionnel si présent en DB

//       const created = await this.prisma.utilisateur.create({
//         data,
//         select: { id: true, nom: true, email: true, telephone: true },
//       });

//       const subject = 'SIGCOM - Compte créé / Account created';
//       const message =
//         `SIGCOM — Compte créé\n\n` +
//         `Bonjour ${created.nom},\n` +
//         `Votre compte a été créé avec succès sur SIGCOM.\n` +
//         `Email : ${created.email}\n` +
//         `Téléphone : ${created.telephone}\n` +
//         `Merci de changer votre mot de passe à la première connexion.\n\n` +
//         `---\n` +
//         `Account created\n\n` +
//         `Hello ${created.nom},\n` +
//         `Your account has been successfully created on SIGCOM.\n` +
//         `Email: ${created.email}\n` +
//         `Phone: ${created.telephone}\n` +
//         `Please change your password at first login.\n`;

//       await this.email.sendEmail(subject, message, created.email);
//       return created;
//     } catch (e: any) {
//       if (e.code === 'P2002') {
//         // unique index fail (email ou téléphone)
//         throw new BadRequestException({
//           message: 'Contrainte d’unicité violée (email ou téléphone).',
//           messageE: 'Unique constraint failed (email or phone).',
//         });
//       }
//       throw e;
//     }
//   }
async create(dto: CreateUserDto) {
  // Téléphone : obligatoire +237 + unicité
  if (!dto.telephone) {
    throw new BadRequestException({
      message: 'Le numéro de téléphone est obligatoire.',
      messageE: 'Phone number is required.',
    });
  }
  if (!dto.telephone.startsWith('+237')) {
    throw new BadRequestException({
      message: 'Numéro de téléphone invalide (doit commencer par +237).',
      messageE: 'Invalid phone number (must start with +237).',
    });
  }
  const telExists = await this.prisma.utilisateur.findUnique({
    where: { telephone: dto.telephone },
    select: { id: true },
  });
  if (telExists) {
    throw new BadRequestException({
      message: 'Numéro de téléphone déjà utilisé.',
      messageE: 'Phone number already in use.',
    });
  }

  // Email unique
  const emailExists = await this.prisma.utilisateur.findUnique({
    where: { email: dto.email },
    select: { id: true },
  });
  if (emailExists) {
    throw new BadRequestException({
      message: 'Adresse email déjà utilisée.',
      messageE: 'Email already in use.',
    });
  }

  let photoUrl: string | undefined;
  if (dto.photoBase64) {
    photoUrl = await uploadImageToCloudinary(dto.photoBase64, 'users');
  }

  // ✅ bcrypt
  const hash = await bcrypt.hash(dto.mot_de_passe, 10);

  try {
    const data: any = {
      nom: dto.nom,
      email: dto.email,
      mot_de_passe: hash,
      telephone: dto.telephone,
      communeId: dto.communeId ?? null,
      ville: dto.ville ?? null,
      adresse: dto.adresse ?? null,
      is_verified: dto.is_verified ?? false,
      is_block: dto.is_block ?? false,
    };
    if (photoUrl) data.photo_url = photoUrl;

    const created = await this.prisma.utilisateur.create({
      data,
      select: { id: true, nom: true, email: true, telephone: true },
    });

    const subject = 'SIGCOM - Compte créé / Account created';
    const message =
`SIGCOM — Compte créé

Bonjour ${created.nom},
Votre compte a été créé avec succès sur SIGCOM.
Email : ${created.email}
Téléphone : ${created.telephone}
Merci de changer votre mot de passe à la première connexion.

---
Account created

Hello ${created.nom},
Your account has been successfully created on SIGCOM.
Email: ${created.email}
Phone: ${created.telephone}
Please change your password at first login.
`;
    await this.email.sendEmail(subject, message, created.email);

    return created;
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw new BadRequestException({
        message: 'Contrainte d’unicité violée (email ou téléphone).',
        messageE: 'Unique constraint failed (email or phone).',
      });
    }
    throw e;
  }}
  /** Récupération d'un utilisateur. */
  async findOne(id: number) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        communeId: true,
        commune: { select: { id: true, nom: true,nom_en:true,arrondissement:true,departement:true,region:true } },
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

  /**
   * Mise à jour d'un utilisateur.
   * - si telephone fourni : format + unicité (hors lui-même)
   * - re-hash si mot_de_passe fourni
   * - upload image Cloudinary si base64
   */
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
      photoUrl = await uploadImageToCloudinary(dto.photoBase64, 'users');
    }

    const data: any = {
      nom: dto.nom,
      email: dto.email,
      telephone: dto.telephone,
      communeId: dto.communeId,
      ville: dto.ville,
      adresse:dto.adresse,
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

  /** Suppression d'un utilisateur. */
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
}
