// import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
// import { PrismaService } from '../../prisma/prisma.service';

// /**
//  * Vérifie que l'utilisateur n'est pas bloqué.
//  * On relit la DB pour être sûr (fraîcheur).
//  */
// @Injectable()
// export class NotBlockedGuard implements CanActivate {
//   constructor(private readonly prisma: PrismaService) {}

//   async canActivate(ctx: ExecutionContext): Promise<boolean> {
//     const req = ctx.switchToHttp().getRequest();
//     const userId = req?.sub as number | undefined;
//     if (!userId) {
//       throw new ForbiddenException({
//         message: 'Accès refusé.',
//         messageE: 'Access denied.',
//       });
//     }

//     const user = await this.prisma.utilisateur.findUnique({
//       where: { id: userId },
//       select: { is_block: true },
//     });

//     if (!user || user.is_block) {
//       throw new ForbiddenException({
//         message: 'Votre compte est bloqué.',
//         messageE: 'Your account is blocked.',
//       });
//     }
    
//     return true;
//     }
// }
// src/auth/guards/not-blocked.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Vérifie que l'utilisateur n'est pas bloqué (lecture fraîche en DB).
 * Compatible PostgreSQL (aucun changement d’output).
 */
@Injectable()
export class NotBlockedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId = req?.sub as number | undefined;
    if (!userId) {
      throw new ForbiddenException({
        message: 'Accès refusé.',
        messageE: 'Access denied.',
      });
    }

    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { is_block: true },
    });

    if (!user || user.is_block) {
      throw new ForbiddenException({
        message: 'Votre compte est bloqué.',
        messageE: 'Your account is blocked.',
      });
    }

    return true;
  }
}
