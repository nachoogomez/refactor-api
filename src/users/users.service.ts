import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import type { CreateUserDto } from "./create-user.dto"
import type { UserPaginator } from "./user.paginator.dto"
import * as bcrypt from "bcrypt"
import type { Prisma } from "@prisma/client"

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: UserPaginator) {
    let where: Prisma.UserWhereInput = { deleted: false }
    let skip
    let take
    let orderBy: Prisma.UserOrderByWithRelationInput
    let metadata

  
    if (params.name) {
      where = {
        ...where,
        OR: [
          { name: { contains: params.name, mode: "insensitive" } },
          { last_name: { contains: params.name, mode: "insensitive" } },
        ],
      }
    }

    if (params.id) where = { ...where, id_visible: params.id }
    if (params.mail) where = { ...where, mail: { contains: params.mail } }
    if (params.username) where = { ...where, username: { contains: params.username } }
    if (params.active !== undefined) where = { ...where, active: params.active }
    if (params.root) where = { ...where, root: params.root }

   
    const totalRecords = await this.prisma.user.count({ where })
    const lastPage = Math.ceil(totalRecords / (params.perPage || 1))


    if (params.page && params.perPage) {
      skip = (params.page - 1) * params.perPage
      take = params.perPage
    }

  
    if (params.sortBy) {
      orderBy = {
        [params.sortByProperty || "id"]: params.sortBy,
      }
    }


    const data = await this.prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        userCity: {
          where: { city: { active: true, deleted: false } },
          include: { city: true },
        },
      },
    })

  
    if (params.page && params.perPage) {
      metadata = {
        page: params.page,
        totalRecords,
        lastPage,
      }
    } else {
      metadata = { totalRecords }
    }

    return { data, metadata }
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id },
      include: {
        userCity: {
          where: { city: { active: true, deleted: false } },
          include: { city: true },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    return user
  }

  async update(id: string, updateUserDto: Partial<CreateUserDto>) {
    const user = await this.findOne(id)

 
    if (updateUserDto.old_password) {
      const validPassword = bcrypt.compareSync(updateUserDto.old_password, user.password)

      if (!validPassword) {
        throw new UnauthorizedException("Wrong password")
      }

      const hashPassword = bcrypt.hashSync(updateUserDto.password, 12)

      const result = await this.prisma.user
        .update({
          where: { id },
          data: {
            password: hashPassword,
            otp: updateUserDto.otp,
          },
        })
        .catch((err) => {
          throw new BadRequestException(err)
        })

      const { password: _, ...updateUser } = result
      return updateUser
    }
   
    else {
      const { deletedCityID = [], updateCityID = [], ...rest } = updateUserDto

      const result = await this.prisma.user
        .update({
          where: { id },
          data: {
            ...rest,
            userCity: {
              create: updateCityID.length > 0 ? updateCityID.map((c) => ({ cityID: c })) : undefined,
              deleteMany: deletedCityID.length > 0 ? deletedCityID.map((c) => ({ cityID: c })) : undefined,
            },
          },
          include: {
            userCity: {
              where: { city: { active: true, deleted: false } },
              include: { city: true },
            },
          },
        })
        .catch((err) => {
          throw new BadRequestException(err)
        })

      const { password: _, ...userWithoutPassword } = result
      return userWithoutPassword
    }
  }

  async remove(id: string) {
    await this.findOne(id) 

    const user = await this.update(id, {
      deleted: true,
      deleteDate: new Date(),
    })

    if (!user) {
      throw new BadRequestException("Failed to delete user")
    }

    return `User with ID ${id} removed`
  }
}
