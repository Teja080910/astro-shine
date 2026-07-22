import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Inject } from '@nestjs/common';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    const payload = await this.authService.validateToken(token);

    let isActive = false;
    if (payload.role === 'user') {
      const user = await this.db.query.users.findFirst({ where: eq(schema.users.id, payload.userId) });
      isActive = !!(user && user.isActive);
    } else if (payload.role === 'admin') {
      const admin = await this.db.query.admins.findFirst({ where: eq(schema.admins.id, payload.userId) });
      isActive = !!(admin && admin.isActive);
    } else if (payload.role === 'astrologer') {
      const astro = await this.db.query.astrologers.findFirst({ where: eq(schema.astrologers.id, payload.userId) });
      isActive = !!(astro && astro.isActive);
    }

    if (!isActive) {
      throw new UnauthorizedException('Account is deactivated or does not exist');
    }

    request.userId = payload.userId;
    request.userRole = payload.role;
    return true;
  }
}
