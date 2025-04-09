import { Injectable, Logger, UnauthorizedException, BadRequestException } from "@nestjs/common"
import type { JwtService } from "@nestjs/jwt"
import type { PrismaService } from "../prisma/prisma.service"
import * as bcrypt from "bcrypt"
import type { LoginDto } from "./dto/login.dto"
import type { CreateUserDto } from "../users/create-user.dto"
import type { ConfigService } from "../config/config.service"

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.initRootUser()
  }

  private async initRootUser() {
    try {
      const root = await this.prisma.user.findFirst({
        where: { OR: [{ username: "admin" }, { mail: "admin@admin.com" }] },
      })

      if (!root) {
        const rootUser = {
          username: "admin",
          mail: "admin@admin.com",
          password: bcrypt.hashSync("contraseña#admin2024", 12),
          root: true,
        }
        await this.prisma.user.create({ data: rootUser })
        this.logger.log("ROOT USER CREATED")
      } else {
        this.logger.log("ROOT USER ALREADY EXISTS")
      }
    } catch (err) {
      this.logger.error("Failed to initialize root user", err)
    }
  }

  checkToken(token: string): boolean {
    try {
      const payload = this.jwtService.verify(token)
      return !!payload
    } catch (error) {
      return false
    }
  }

  async login(credentials: LoginDto) {
    if (!credentials.username || !credentials.password) {
      throw new UnauthorizedException("Missing credentials")
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: credentials.username }, { mail: credentials.username }],
      },
      include: {
        userCity: {
          where: { city: { active: true, deleted: false } },
          include: { city: true },
        },
      },
    })

    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    const validPassword = bcrypt.compareSync(credentials.password, user.password)

    if (!validPassword) {
      throw new UnauthorizedException("Wrong credentials")
    }

    const { id: sub, username, otp } = user
    const payload = { sub, username, otp }
    const token = this.jwtService.sign(payload)

    const { password: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword, token }
  }

  async register(userData: CreateUserDto, ownerId: string) {
    const user: Partial<CreateUserDto> = {
      id_user: ownerId,
      password: bcrypt.hashSync(userData.password, 12),
      ...userData,
    }

    try {
      const result = await this.prisma.user.create({
        data: {
          ...user,
          userCity: {
            create: userData.updateCityID?.length > 0 ? userData.updateCityID.map((c) => ({ cityID: c })) : undefined,
          },
        },
      })

      const { password: _, ...newUser } = result
      return newUser
    } catch (err) {
      this.logger.error("Failed to register user", err)
      throw new BadRequestException(err)
    }
  }
}
