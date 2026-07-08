import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AdminsService } from '../admin/admins.service';
import { AstrologersService } from '../astrologers/astrologers.service';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: number;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private adminsService: AdminsService,
    private astrologersService: AstrologersService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'default-secret');
    this.jwtExpiresIn = 604800; // 7 days in seconds
  }

  async sendOtp(phone: string): Promise<{ otp: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // TODO: Integrate with SMS provider to send OTP
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return { otp };
  }

  async verifyOtp(phone: string, otp: string): Promise<{ token: string; user: any }> {
    // TODO: Validate OTP against stored/cached OTP
    const isValidDevOtp = otp === '000000' || otp === '123456';
    if (!isValidDevOtp) {
      throw new UnauthorizedException('Invalid OTP');
    }

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

    const token = this.generateToken(user.id);
    const { password: _, ...safeUser } = user;
    return { token, user: safeUser };
  }

  async loginWithEmail(email: string, password: string): Promise<{ token: string; user: any }> {
    let user: any = null;
    let role = 'user';

    // 1. Check Users
    const regularUser = await this.usersService.findByEmail(email);
    if (regularUser && regularUser.isActive && !regularUser.deletedAt && regularUser.password) {
      const isValid = await this.verifyPassword(password, regularUser.password);
      if (isValid) {
        user = regularUser;
        role = 'user';
      }
    }

    // 2. Check Admins if not found
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

    // 3. Check Astrologers if not found
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
    const token = this.generateToken(user.id);
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
      throw new UnauthorizedException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(data.password);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    const { password: _, ...safeUser } = user;
    const token = this.generateToken(user.id);
    return { token, user: safeUser };
  }

  async validateToken(token: string): Promise<{ userId: string }> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as { sub: string };
      return { userId: payload.sub };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, this.jwtSecret, {
      expiresIn: 604800, // 7 days in seconds
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
