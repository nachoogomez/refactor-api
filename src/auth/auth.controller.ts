import { PublicRoute } from "@/common/decorators/public.decorator"
import { Owner } from "@/common/decorators/user.decorator"
import type { CreateUserDto } from "@/users/create-user.dto"
import { Body, Controller, Get, Post } from "@nestjs/common"
import type { AuthService } from "./auth.service"
import type { LoginDto } from "./login.dto"

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check')
  checkToken(@Body('token') token: string) {
    return this.authService.checkToken(token);
  }

  @Post('login')
  @PublicRoute()
  login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  @Post("register")
  register(@Body() userData: CreateUserDto, @Owner() owner: any) {
    return this.authService.register(userData, owner.id)
  }

  @Get('info')
  getUserInfo(@Owner() user: any) {
    return user;
  }
}