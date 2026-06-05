import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  private pool: Pool

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
    const adapter = new PrismaPg(pool)
    super({ adapter })

    this.pool = pool
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Connected to PostgreSQL via Prisma')
  }

  async onModuleDestroy() {
    await this.$disconnect()
    await this.pool.end()
    this.logger.log('Disconnected from PostgreSQL')
  }
}
