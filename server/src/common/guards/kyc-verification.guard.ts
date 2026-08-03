import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../../db/schemas';

export const SKIP_KYC_KEY = 'skipKyc';
export const SkipKyc = () => SetMetadata(SKIP_KYC_KEY, true);

@Injectable()
export class KycVerificationGuard implements CanActivate {
  private readonly logger = new Logger(KycVerificationGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipKyc = this.reflector.getAllAndOverride<boolean>(SKIP_KYC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipKyc) return true;

    const request = context.switchToHttp().getRequest();
    const role = request.userRole;
    const userId = request.userId;

    if (!userId || role !== 'astrologer') return true;

    try {
      const [astrologer] = await this.db
        .select({ verificationStatus: schema.astrologers.verificationStatus })
        .from(schema.astrologers)
        .where(eq(schema.astrologers.userId, userId));

      if (!astrologer || astrologer.verificationStatus !== 'approved') {
        this.logger.warn(`Blocked unverified astrologer ${userId} - status: ${astrologer?.verificationStatus}`);
        throw new ForbiddenException('Your account is pending KYC verification. Please upload and submit your documents for review.');
      }
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      this.logger.error(`KYC guard failed for ${userId}: ${err}`);
      throw new ForbiddenException('Unable to verify KYC status. Please try again.');
    }

    return true;
  }
}
