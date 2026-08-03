import { BadRequestException, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as jwt from 'jsonwebtoken';
import * as schema from '../../db/schemas';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
    private configService: ConfigService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || '';
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  private async findUserByEmail(email: string) {
    return this.db.query.users.findFirst({ where: eq(schema.users.email, email) });
  }

  private async findUserByPhone(phone: string) {
    return this.db.query.users.findFirst({ where: eq(schema.users.phone, phone) });
  }

  async sendEmailOtp(email: string): Promise<{ message: string }> {
    this.logger.log(`sendEmailOtp called for email: ${email}`);
    const user = await this.findUserByEmail(email);
    if (!user) {
      this.logger.warn(`sendEmailOtp failed: user not found for email: ${email}`);
      throw new UnauthorizedException('USER_NOT_FOUND');
    }
    if (!user.isActive || user.deletedAt) {
      this.logger.warn(`sendEmailOtp failed: account inactive/deleted for email: ${email}`);
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }
    return this.generateAndSendOtp(`email:${email}`, email);
  }

  private async generateAndSendOtp(key: string, email: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(key, { otp, expiresAt: Date.now() + 600000 });
    this.logger.log(`OTP generated for key=${key}: ${otp}`);
    try {
      await this.emailService.sendOtpEmail(email, otp);
      this.logger.log(`OTP email sent successfully to ${email}`);
    } catch (e: any) {
      this.logger.error(`Failed to send OTP email to ${email}: ${e.message}`);
      this.otpStore.delete(key);
      throw new BadRequestException('Failed to send OTP email');
    }
    return { message: 'OTP sent to email' };
  }

  async sendForgotPasswordOtp(identifier: string, type: 'email' | 'phone'): Promise<{ message: string }> {
    this.logger.log(`sendForgotPasswordOtp called for ${type}: ${identifier}`);
    const user = type === 'email' ? await this.findUserByEmail(identifier) : await this.findUserByPhone(identifier);
    if (!user) {
      this.logger.warn(`sendForgotPasswordOtp failed: user not found for ${type}: ${identifier}`);
      throw new UnauthorizedException('USER_NOT_FOUND');
    }
    if (!user.isActive || user.deletedAt) {
      this.logger.warn(`sendForgotPasswordOtp failed: account inactive/deleted for ${type}: ${identifier}`);
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }

    if (type === 'email') {
      return this.generateAndSendOtp(`reset:${identifier}`, identifier);
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(`reset:phone:${identifier}`, { otp, expiresAt: Date.now() + 600000 });
    this.logger.log(`Phone OTP for reset key=reset:phone:${identifier}: ${otp}`);

    const reqId = await this.smsService.sendOtp(identifier, otp);
    if (reqId) {
      this.otpStore.set(`reset:phone:${identifier}`, { otp: reqId, expiresAt: Date.now() + 600000 });
      this.logger.log(`Reset phone OTP reqId stored: ${reqId}`);
    } else {
      this.logger.error(`Failed to send forgot-password SMS OTP to ${identifier}`);
    }

    return { message: 'OTP sent to phone' };
  }

  async resetPassword(identifier: string, otp: string, newPassword: string, type: 'email' | 'phone' = 'email'): Promise<{ success: boolean }> {
    const key = type === 'email' ? `reset:${identifier}` : `reset:phone:${identifier}`;
    const stored = this.otpStore.get(key);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (type === 'phone') {
      const verified = await this.smsService.verifyWidgetOtp(stored.otp, otp);
      if (!verified) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }
    } else if (stored.otp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    this.otpStore.delete(key);

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const user = type === 'email' ? await this.findUserByEmail(identifier) : await this.findUserByPhone(identifier);
    if (!user) throw new UnauthorizedException('USER_NOT_FOUND');

    const hashedPassword = await this.hashPassword(newPassword);
    await this.db.update(schema.users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));

    return { success: true };
  }

  async sendRegistrationOtp(identifier: string, type: 'email' | 'phone'): Promise<{ message: string }> {
    this.logger.log(`sendRegistrationOtp called for ${type}: ${identifier}`);
    if (type === 'email') {
      const existing = await this.findUserByEmail(identifier);
      if (existing) {
        this.logger.warn(`sendRegistrationOtp failed: email already registered: ${identifier}`);
        throw new BadRequestException('Email already registered');
      }
    } else {
      const existing = await this.findUserByPhone(identifier);
      if (existing) {
        this.logger.warn(`sendRegistrationOtp failed: phone already registered: ${identifier}`);
        throw new BadRequestException('Phone number already registered');
      }
      if (!identifier || identifier.length < 10) throw new BadRequestException('Valid phone number is required');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `reg:${type}:${identifier}`;
    this.otpStore.set(key, { otp, expiresAt: Date.now() + 600000 });
    this.logger.log(`Registration OTP for key=${key}: ${otp}`);

    if (type === 'email') {
      try {
        await this.emailService.sendOtpEmail(identifier, otp);
        this.logger.log(`Registration OTP email sent to ${identifier}`);
      } catch (e: any) {
        this.otpStore.delete(key);
        throw new BadRequestException('Failed to send OTP email');
      }
    } else {
      const reqId = await this.smsService.sendOtp(identifier, otp);
      if (reqId) {
        this.otpStore.set(key, { otp: reqId, expiresAt: Date.now() + 600000 });
        this.logger.log(`Registration phone OTP reqId stored: ${reqId}`);
      } else {
        this.logger.error(`Failed to send registration SMS OTP to ${identifier}`);
      }
    }

    return { message: `OTP sent to ${type === 'email' ? 'email' : 'phone'}` };
  }

  async verifyRegistrationOtp(identifier: string, type: 'email' | 'phone', otp: string): Promise<{ verified: true }> {
    const key = `reg:${type}:${identifier}`;
    const stored = this.otpStore.get(key);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (type === 'phone') {
      const verified = await this.smsService.verifyWidgetOtp(stored.otp, otp);
      if (!verified) {
        throw new UnauthorizedException('Invalid or expired OTP');
      }
    } else if (stored.otp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    this.otpStore.delete(key);
    return { verified: true };
  }

  async verifyEmailOtp(email: string, otp: string): Promise<{ token: string; user: any; astrologer?: any }> {
    const stored = this.otpStore.get(`email:${email}`);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    this.otpStore.delete(`email:${email}`);

    const user = await this.findUserByEmail(email);
    if (!user) throw new UnauthorizedException('USER_NOT_FOUND');
    if (!user.isActive || user.deletedAt) throw new UnauthorizedException('Account has been deleted or deactivated');

    const token = this.generateToken(user.id, user.role);
    const { password: _, ...safeUser } = user;

    if (user.role === 'astrologer') {
      const astrologer = await this.getAstrologerProfile(user.id);
      return { token, user: safeUser, astrologer };
    }
    return { token, user: safeUser };
  }

  async checkPhone(phone: string): Promise<{ exists: boolean }> {
    const user = await this.findUserByPhone(phone);
    return { exists: !!user };
  }

  async checkEmail(email: string): Promise<{ exists: boolean }> {
    const user = await this.findUserByEmail(email);
    return { exists: !!user };
  }

  async sendPhoneOtp(phone: string): Promise<{ message: string }> {
    this.logger.log(`sendPhoneOtp called for phone: ${phone}`);
    const user = await this.findUserByPhone(phone);
    if (!user) {
      this.logger.warn(`sendPhoneOtp failed: user not found for phone: ${phone}`);
      throw new UnauthorizedException('USER_NOT_FOUND');
    }
    if (!user.isActive || user.deletedAt) {
      this.logger.warn(`sendPhoneOtp failed: account inactive/deleted for phone: ${phone}`);
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(`phone:${phone}`, { otp, expiresAt: Date.now() + 600000 });
    this.logger.log(`Phone OTP for key=phone:${phone}: ${otp}`);

    const reqId = await this.smsService.sendOtp(phone, otp);
    if (reqId) {
      this.otpStore.set(`phone:${phone}`, { otp: reqId, expiresAt: Date.now() + 600000 });
      this.logger.log(`Phone OTP reqId stored: ${reqId}`);
    } else {
      this.logger.error(`Failed to send SMS OTP to ${phone}`);
    }

    return { message: 'OTP sent to phone' };
  }

  async loginWithPhone(phone: string, otp: string): Promise<{ token: string; user: any; astrologer?: any }> {
    const stored = this.otpStore.get(`phone:${phone}`);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const reqId = stored.otp;
    const verified = await this.smsService.verifyWidgetOtp(reqId, otp);
    if (!verified) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    this.otpStore.delete(`phone:${phone}`);

    const user = await this.findUserByPhone(phone);
    if (!user) throw new UnauthorizedException('USER_NOT_FOUND');
    if (!user.isActive || user.deletedAt) throw new UnauthorizedException('Account has been deleted or deactivated');
    const token = this.generateToken(user.id, user.role);
    const { password: _, ...safeUser } = user;

    if (user.role === 'astrologer') {
      const astrologer = await this.getAstrologerProfile(user.id);
      return { token, user: safeUser, astrologer };
    }
    return { token, user: safeUser };
  }

  async loginWithEmail(email: string, password: string): Promise<{ token: string; user: any; astrologer?: any }> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.deletedAt) {
      throw new UnauthorizedException('This account has been deactivated. Please contact the administrator.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact the administrator.');
    }
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.role);
    const { password: _, ...safeUser } = user;

    if (user.role === 'astrologer') {
      const astrologer = await this.getAstrologerProfile(user.id);
      return { token, user: safeUser, astrologer };
    }
    return { token, user: safeUser };
  }

  async registerWithEmail(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'user' | 'astrologer' | 'admin';
  }): Promise<{ token: string; user: any }> {
    const existing = await this.findUserByEmail(data.email);
    if (existing) throw new BadRequestException('Email already registered');

    if (data.phone) {
      const existingPhone = await this.findUserByPhone(data.phone);
      if (existingPhone) throw new BadRequestException('Phone number already registered');
    }

    const hashedPassword = await this.hashPassword(data.password);
    const [user] = await this.db.insert(schema.users).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: data.role || 'user',
    }).returning();

    await this.db.insert(schema.wallets).values({ userId: user.id }).onConflictDoNothing();

    try {
      await this.emailService.sendWelcomeEmail(data.email, data.name);
    } catch {}

    const { password: _, ...safeUser } = user;
    const token = this.generateToken(user.id, user.role);
    return { token, user: safeUser };
  }

  async registerAstrologer(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    specialization?: string[];
    experience?: number;
  }): Promise<{ token: string; user: any; astrologer: any }> {
    const existing = await this.findUserByEmail(data.email);
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await this.hashPassword(data.password);
    const [user] = await this.db.insert(schema.users).values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      role: 'astrologer',
    }).returning();

    const [astrologer] = await this.db.insert(schema.astrologers).values({
      userId: user.id,
      specialization: data.specialization || [],
      experience: data.experience || 0,
    }).returning();

    await this.db.insert(schema.commissions).values({
      astrologerId: user.id,
      type: 'percentage',
      value: '0',
      minAmount: '0',
      maxCap: '0',
      isActive: false,
    }).onConflictDoNothing();

    await this.db.insert(schema.wallets).values({ userId: user.id, astrologerId: user.id }).onConflictDoNothing();

    try {
      await this.emailService.sendWelcomeEmail(data.email, data.name);
    } catch {}

    const { password: _, ...safeUser } = user;
    const token = this.generateToken(user.id, 'astrologer');
    return { token, user: safeUser, astrologer: { name: user.name, email: user.email, phone: user.phone, ...astrologer } };
  }

  async registerAdmin(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: any; admin: any }> {
    const existing = await this.findUserByEmail(data.email);
    if (existing) throw new BadRequestException('Email already registered');

    const hashedPassword = await this.hashPassword(data.password);
    const [user] = await this.db.insert(schema.users).values({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: 'admin',
    }).returning();

    const [admin] = await this.db.insert(schema.admins).values({
      userId: user.id,
      role: 'admin',
    }).returning();

    await this.db.insert(schema.wallets).values({ userId: user.id, adminId: user.id }).onConflictDoNothing();

    const { password: _, ...safeUser } = user;
    const token = this.generateToken(user.id, 'admin');
    return { token, user: safeUser, admin };
  }

  async validateToken(token: string): Promise<{ userId: string; role: string }> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as { sub: string; role: string };
      return { userId: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async getAstrologerProfile(userId: string) {
    const [astro] = await this.db
      .select({
        userId: schema.astrologers.userId,
        experience: schema.astrologers.experience,
        specialization: schema.astrologers.specialization,
        languages: schema.astrologers.languages,
        skills: schema.astrologers.skills,
        pricePerMin: schema.astrologers.pricePerMin,
        chatPricePerMin: schema.astrologers.chatPricePerMin,
        audioCallPricePerMin: schema.astrologers.audioCallPricePerMin,
        videoCallPricePerMin: schema.astrologers.videoCallPricePerMin,
        rating: schema.astrologers.rating,
        totalReviews: schema.astrologers.totalReviews,
        totalCalls: schema.astrologers.totalCalls,
        totalChats: schema.astrologers.totalChats,
        totalAudioCalls: schema.astrologers.totalAudioCalls,
        totalVideoCalls: schema.astrologers.totalVideoCalls,
        totalEarnings: schema.astrologers.totalEarnings,
        verificationStatus: schema.astrologers.verificationStatus,
        verificationDoc: schema.astrologers.verificationDoc,
        verificationNote: schema.astrologers.verificationNote,
        onlineStatus: schema.astrologers.onlineStatus,
        bio: schema.astrologers.bio,
        createdAt: schema.astrologers.createdAt,
        updatedAt: schema.astrologers.updatedAt,
      })
      .from(schema.astrologers)
      .where(eq(schema.astrologers.userId, userId));
    return astro || null;
  }

  async checkPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user || !user.password) return false;
    return this.verifyPassword(password, user.password);
  }

  async updatePasswordInDb(userId: string, newPassword: string, _role?: string): Promise<void> {
    const hashed = await this.hashPassword(newPassword);
    await this.db.update(schema.users)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  private generateToken(userId: string, role: string): string {
    return jwt.sign({ sub: userId, role }, this.jwtSecret, { expiresIn: 604800 });
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
