import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JWTGuard } from './auth/guard/jwt.guard';
import { ClaimModule } from './claim/claim.module';
import { NeighborhoodModule } from './neighborhood/neighborhood.module';
import { CityModule } from './city/city.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PrismaModule } from './prisma/prisma.module';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ClaimModule,
    NeighborhoodModule,
    CityModule,
    ServeStaticModule.forRoot({
      rootPath: process.env.PRODUCTION
        ? process.env.UPLOADS_PATH
        : join(__dirname, '..', 'uploads'),
      serveRoot: '/api/uploads',
    }),
  ],
  providers: [{ provide: 'APP_GUARD', useClass: JWTGuard }],
})
export class AppModule {}
