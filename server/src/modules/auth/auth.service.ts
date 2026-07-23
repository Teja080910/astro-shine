import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as jwt from 'jsonwebtoken';
import * as schema from '../../db/schemas';
import { AdminsService } from '../admin/admins.service';
import { AstrologersService } from '../astrologers/astrologers.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private configService: ConfigService,
    private usersService: UsersService,
    private adminsService: AdminsService,
    private astrologersService: AstrologersService,
    private emailService: EmailService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || '';
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  async sendEmailOtp(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }

    return this.generateAndSendOtp(`email:${email}`, email);
  }

  private async generateAndSendOtp(key: string, email: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(key, { otp, expiresAt: Date.now() + 600000 });
    try {
      await this.emailService.sendOtpEmail(email, otp);
    } catch (e) {
      this.otpStore.delete(key);
      throw new BadRequestException('Failed to send OTP email');
    }
    return { message: 'OTP sent to email' };
  }

  async sendForgotPasswordOtp(identifier: string, type: 'email' | 'phone'): Promise<{ message: string }> {
    if (type === 'email') {
      const user = await this.usersService.findByEmail(identifier);
      if (!user) throw new UnauthorizedException('USER_NOT_FOUND');
      if (!user.isActive || user.deletedAt) throw new UnauthorizedException('Account has been deleted or deactivated');
      return this.generateAndSendOtp(`reset:${identifier}`, identifier);
    } else {
      const user = await this.usersService.findByPhone(identifier);
      if (!user) throw new UnauthorizedException('USER_NOT_FOUND');
      if (!user.isActive || user.deletedAt) throw new UnauthorizedException('Account has been deleted or deactivated');
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      this.otpStore.set(`reset:phone:${identifier}`, { otp, expiresAt: Date.now() + 600000 });
      return { message: 'OTP sent to phone' };
    }
  }

  async resetPassword(identifier: string, otp: string, newPassword: string, type: 'email' | 'phone' = 'email'): Promise<{ success: boolean }> {
    const key = type === 'email' ? `reset:${identifier}` : `reset:phone:${identifier}`;
    const stored = this.otpStore.get(key);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    this.otpStore.delete(key);

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const user = type === 'email'
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByPhone(identifier);
    if (!user) throw new UnauthorizedException('USER_NOT_FOUND');

    await this.usersService.updatePassword(user.id, newPassword, 'user');
    return { success: true };
  }

  async sendRegistrationOtp(identifier: string, type: 'email' | 'phone'): Promise<{ message: string }> {
    if (type === 'email') {
      const existing = await this.usersService.findByEmail(identifier);
      if (existing) throw new BadRequestException('Email already registered');
    } else {
      const existing = await this.usersService.findByPhone(identifier);
      if (existing) throw new BadRequestException('Phone number already registered');
      if (!identifier || identifier.length < 10) throw new BadRequestException('Valid phone number is required');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `reg:${type}:${identifier}`;
    this.otpStore.set(key, { otp, expiresAt: Date.now() + 600000 });

    if (type === 'email') {
      try {
        await this.emailService.sendOtpEmail(identifier, otp);
      } catch (e) {
        this.otpStore.delete(key);
        throw new BadRequestException('Failed to send OTP email');
      }
    }

    return { message: `OTP sent to ${type === 'email' ? 'email' : 'phone'}` };
  }

  async verifyRegistrationOtp(identifier: string, type: 'email' | 'phone', otp: string): Promise<{ verified: true }> {
    const key = `reg:${type}:${identifier}`;
    const stored = this.otpStore.get(key);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    this.otpStore.delete(key);
    return { verified: true };
  }

  async verifyEmailOtp(email: string, otp: string): Promise<{ token: string; user: any }> {
    const stored = this.otpStore.get(`email:${email}`);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    this.otpStore.delete(`email:${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }

    const token = this.generateToken(user.id, 'user');
    const { password: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async checkPhone(phone: string): Promise<{ exists: boolean }> {
    const user = await this.usersService.findByPhone(phone);
    return { exists: !!user };
  }

  async sendPhoneOtp(phone: string): Promise<{ message: string }> {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(`phone:${phone}`, { otp, expiresAt: Date.now() + 600000 });
    return { message: 'OTP sent to phone' };
  }

  async loginWithPhone(phone: string, otp: string): Promise<{ token: string; user: any }> {
    const stored = this.otpStore.get(`phone:${phone}`);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    this.otpStore.delete(`phone:${phone}`);

    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }
    const token = this.generateToken(user.id, 'user');
    const { password: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async loginWithEmail(email: string, password: string): Promise<{ token: string; user: any }> {
    let user: any = null;
    let role = 'user';

    const regularUser = await this.usersService.findByEmail(email);
    if (regularUser && regularUser.isActive && !regularUser.deletedAt && regularUser.password) {
      const isValid = await this.verifyPassword(password, regularUser.password);
      if (isValid) {
        user = regularUser;
        role = 'user';
      }
    }

    if (!user) {
      const adminUser = await this.adminsService.findByEmail(email);
      if (adminUser && adminUser.isActive !== false && adminUser.password) {
        const isValid = await this.verifyPassword(password, adminUser.password);
        if (isValid) {
          user = adminUser;
          role = adminUser.role || 'admin';
        }
      }
    }

    if (!user) {
      const astrologerUser = await this.astrologersService.findByEmail(email);
      if (astrologerUser && astrologerUser.isActive !== false && astrologerUser.password) {
        const isValid = await this.verifyPassword(password, astrologerUser.password);
        if (isValid) {
          user = astrologerUser;
          role = 'astrologer';
        }
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...safeUser } = user;
    const token = this.generateToken(user.id, role);
    return { token, user: { ...safeUser, role } };
  }

  async registerWithEmail(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ token: string; user: any }> {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    if (data.phone) {
      const existingPhone = await this.usersService.findByPhone(data.phone);
      if (existingPhone) {
        throw new BadRequestException('Phone number already registered');
      }
    }

    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    await this.db.insert(schema.wallets).values({ userId: user.id }).onConflictDoNothing();

    await this.emailService.sendWelcomeEmail(data.email, data.name);

    const { password: _, ...safeUser } = user;
    const token = this.generateToken(user.id, 'user');
    return { token, user: safeUser };
  }

  async validateToken(token: string): Promise<{ userId: string; role: string }> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as { sub: string; role: string };
      return { userId: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private generateToken(userId: string, role: string): string {
    return jwt.sign({ sub: userId, role }, this.jwtSecret, {
      expiresIn: 604800,
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':');
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex') === key);
      });
    });
  }
}
