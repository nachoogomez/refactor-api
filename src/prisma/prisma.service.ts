import { Injectable, type OnModuleInit, type OnModuleDestroy, Logger } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  async onModuleInit() {
    await this.$connect()
    this.logger.log("Database connection established")
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log("Database connection closed")
  }
}
