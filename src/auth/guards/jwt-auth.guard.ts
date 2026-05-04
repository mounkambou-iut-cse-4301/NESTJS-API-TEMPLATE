import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    const header = (req.headers?.authorization || '') as string;
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException({
        message: 'Token manquant.',
        messageE: 'Missing token.',
      });
    }

    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get<string>('JWT_SECRET') || 'dev-secret',
      });

      req.sub = payload.sub;
      req.user = payload.user;
      req.roles = payload.roles || [];
      req.permissions = payload.permissions || [];

      return true;
    } catch {
      throw new UnauthorizedException({
        message: 'Token invalide ou expiré.',
        messageE: 'Invalid or expired token.',
      });
    }
  }
}