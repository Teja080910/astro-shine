import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schemas';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE_DB') private db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.query.users.findMany();
  }

  async findById(id: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
  }

  async findAstrologerById(id: string) {
    return this.db.query.astrologers.findFirst({
      where: eq(schema.astrologers.id, id),
    });
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  }

  async findByPhone(phone: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.phone, phone),
    });
  }

  async create(data: typeof schema.users.$inferInsert) {
    const [user] = await this.db.insert(schema.users).values(data).returning();
    return user;
  }

  async update(id: string, data: Partial<typeof schema.users.$inferInsert>) {
    const [user] = await this.db
      .update(schema.users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return user;
  }

  async softDelete(id: string) {
    await this.db
      .update(schema.users)
      .set({ deletedAt: new Date(), updatedAt: new Date(), isActive: false })
      .where(eq(schema.users.id, id));
  }

  async verifyPassword(id: string, password: string): Promise<boolean> {
    let account: any = await this.findById(id);
    if (!account) {
      account = await this.db.query.admins.findFirst({
        where: eq(schema.admins.id, id),
      });
    }
    if (!account) {
      account = await this.db.query.astrologers.findFirst({
        where: eq(schema.astrologers.id, id),
      });
    }

    if (!account || !account.password) return false;
    return this.checkPassword(password, account.password);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);

    const userResult = await this.db
      .update(schema.users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();

    if (userResult.length > 0) return;

    const adminResult = await this.db
      .update(schema.admins)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.admins.id, id))
      .returning();

    if (adminResult.length > 0) return;

    await this.db
      .update(schema.astrologers)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(schema.astrologers.id, id));
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

  private async checkPassword(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':');
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex') === key);
      });
    });
  }
}
import * as crypto from 'crypto';
