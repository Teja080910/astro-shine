import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const userRole = request.userRole;

    this.logger.log(`Checking roles - required: [${requiredRoles}], userRole: ${userRole}`);

    if (!userRole) {
      throw new ForbiddenException('No role assigned to user');
    }
    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
