import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    const payload = await this.authService.validateToken(token);

    this.logger.log(`AuthGuard - userId: ${payload.userId}, role: ${payload.role}`);

    request.userId = payload.userId;
    request.userRole = payload.role;
    return true;
  }
}
