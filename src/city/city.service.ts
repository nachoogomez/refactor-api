import { Injectable } from "@nestjs/common"
import type { PrismaService } from "../prisma/prisma.service"
import type { CreateCityDto } from "./create-city.dto"
import type { CityPaginatorDto } from "./city-paginator.dto"
import type { Prisma } from "@prisma/client"

@Injectable()
export class CityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCityDto, userId: string) {
    return this.prisma.city.create({
      data: {
        id_visible: (await this.prisma.city.count()) + 1,
        ...data,
        uploadUserID: userId,
      },
      include: {
        uploadUser: {
          select: { name: true, last_name: true, id: true, username: true },
        },
      },
    })
  }

  async findAll(params: CityPaginatorDto) {
    let where: Prisma.CityWhereInput = { deleted: false }

    if (params.id) where = { ...where, id: params.id }
    if (params.active !== undefined) where = { ...where, active: params.active }

    
    const totalRecords = await this.prisma.city.count({ where })
    const lastPage = Math.ceil(totalRecords / (params.perPage || 1))

    const data = await this.prisma.city.findMany({
      where,
      skip: params.page && params.perPage ? (params.page - 1) * params.perPage : undefined,
      take: params.page && params.perPage ? params.perPage : undefined,
      orderBy: params.sortBy
        ? {
            [params.sortByProperty || "id_visible"]: params.sortBy,
          }
        : undefined,
      include: {
        uploadUser: {
          select: { name: true, last_name: true, id: true, username: true },
        },
      },
    })

  
    return {
      data,
      metadata:
        params.page && params.perPage
          ? {
              page: params.page,
              totalRecords,
              lastPage,
            }
          : {
              totalRecords,
            },
    }
  }

  async findOne(id: string) {
    return this.prisma.city.findFirst({
      where: { id },
      include: {
        uploadUser: {
          select: { name: true, last_name: true, id: true, username: true },
        },
      },
    })
  }

  async update(id: string, data: Partial<CreateCityDto>) {
    return this.prisma.city.update({
      data,
      where: { id },
      include: {
        uploadUser: {
          select: { name: true, last_name: true, id: true, username: true },
        },
      },
    })
  }

  async remove(id: string) {
    await this.update(id, {
      deleted: true,
      deletedAt: new Date(),
    })
    return `City with ID ${id} removed`
  }
}
