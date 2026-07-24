import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ConfigService } from '@nestjs/config';
import * as schema from '../db/schemas';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
          throw new Error('DATABASE_URL environment variable is required');
        }
        return new Pool({ connectionString: databaseUrl });
      },
      inject: [ConfigService],
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
