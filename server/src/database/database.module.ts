import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schemas';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: () => {
        return new Pool({
          connectionString: process.env.DATABASE_URL,
        });
      },
    },
    {
      provide: 'DRIZZLE_DB',
      useFactory: (pool: Pool) => {
        return drizzle(pool, { schema });
      },
      inject: ['DATABASE_POOL'],
    },
  ],
  exports: ['DATABASE_POOL', 'DRIZZLE_DB'],
})
export class DatabaseModule {}
