import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
      where: { id: Number(userId) },
      select: {
        id: true,
        isBlock: true,
        isDeleted: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new ForbiddenException({
        message: 'Compte introuvable ou supprimé.',
        messageE: 'Account not found or deleted.',
      });
    }

    if (user.isBlock) {
      throw new ForbiddenException({
        message: 'Votre compte est bloqué.',
        messageE: 'Your account is blocked.',
      });
    }

    return true;
  }
}