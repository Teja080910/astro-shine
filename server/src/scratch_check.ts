import 'dotenv/config';
import { db } from './db/connection';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const result = await db.execute(sql`
      SELECT r.id, r.user_id, r.astrologer_id, r.rating, r.comment,
             r.is_visible, r.created_at, r.updated_at,
             COALESCE(u1.name, '') AS user_name,
             COALESCE(u2.name, '') AS astrologer_name
      FROM reviews r
      LEFT JOIN users u1 ON r.user_id = u1.id
      LEFT JOIN astrologers a ON r.astrologer_id = a.user_id
      LEFT JOIN users u2 ON a.user_id = u2.id
      ORDER BY r.created_at DESC
    `);
    console.log('REVIEWS COUNT:', result.rows.length);
    console.log('FIRST REVIEW:', result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
