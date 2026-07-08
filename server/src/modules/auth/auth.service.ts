import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AdminsService } from '../admin/admins.service';
import { AstrologersService } from '../astrologers/astrologers.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private adminsService: AdminsService,
    private astrologersService: AstrologersService,
    private emailService: EmailService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'default-secret');
  }

  async sendEmailOtp(email: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore.set(`email:${email}`, { otp, expiresAt: Date.now() + 600000 });
    await this.emailService.sendOtpEmail(email, otp);
    return { message: 'OTP sent to email' };
  }

  async verifyEmailOtp(email: string, otp: string): Promise<{ token: string; user: any }> {
    const stored = this.otpStore.get(`email:${email}`);
    if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    this.otpStore.delete(`email:${email}`);

    let user = await this.usersService.findByEmail(email);
    if (user && (!user.isActive || user.deletedAt)) {
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }

    if (!user) {
      user = await this.usersService.create({
        email,
        name: email.split('@')[0],
      });
    }

    const token = this.generateToken(user.id, 'user');
    const { password: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async loginWithPhone(phone: string): Promise<{ token: string; user: any }> {
    let user = await this.usersService.findByPhone(phone);
    if (user && (!user.isActive || user.deletedAt)) {
      throw new UnauthorizedException('Account has been deleted or deactivated');
    }
    if (!user) {
      user = await this.usersService.create({
        email: `${phone}@phone.astroshine.com`,
        phone,
        name: `User ${phone.slice(-4)}`,
      });
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

    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

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
