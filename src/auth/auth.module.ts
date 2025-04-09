import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { JWTPassport } from './passport/jwt.passport';
import { AuthService } from "./auth.service"

@Module({
  imports: [
    JwtModule.register({
      secret: 'SEED_DE_JWT',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService,JWTPassport],
  exports: [AuthService],
})
export class AuthModule {}
