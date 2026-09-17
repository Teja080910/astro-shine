import 'dotenv/config';
import { db, schema } from './db/connection';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
};

async function updatePassword() {
  const email = 'testadmin@example.com';
  const password = '@Sriram123';
  const hashed = hashPassword(password);

  const [user] = await db
    .update(schema.users)
    .set({ password: hashed, updatedAt: new Date() })
    .where(eq(schema.users.email, email))
    .returning({ id: schema.users.id, email: schema.users.email });

  if (!user) {
    console.error('❌ User not found:', email);
    process.exit(1);
  }

  console.log('✅ Password updated for:', user.email, '(', user.id, ')');
  process.exit(0);
}

updatePassword().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
