import { Owner } from "@/common/decorators/user.decorator"
import {
  Body,
  Controller,
  Delete,
  Get,
  type OnModuleDestroy,
  type OnModuleInit,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common"
import { type Prisma, PrismaClient } from "@prisma/client"
import type { CreateNeighborhoodDto } from "./create-neighborhood.dto"
import type { NeighborhoodPaginatorDto } from "./neighborhood-paginator.dto"

@Controller("neighborhood")
export class NeighborhoodController extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    this.$connect()
  }

  onModuleDestroy() {
    this.$disconnect()
  }

  @Post()
  async create(@Body() data: CreateNeighborhoodDto, @Owner() usuario) {
    return this.neighborhood.create({
      data: {
        id_visible: (await this.neighborhood.count()) + 1,
        ...data,
        uploadUserID: usuario ? usuario.id : undefined,
      },
      include: {
        uploadUser: {
          select: { name: true, last_name: true, id: true, username: true },
        },
        city: true,
      },
    })
  }

  @Get()
  async findAll(@Query() p: NeighborhoodPaginatorDto) {
    //! Filtramos automáticamente los eliminados -------------------->
    let where: Prisma.NeighborhoodWhereInput = { deleted: false };

    if (p.id) where = { ...where, id: p.id };
    if (p.name)
      where = { ...where, name: { contains: p.name, mode: 'insensitive' } };
    if (p.active != undefined) where = { ...where, active: p.active };

    const data = await this.neighborhood.findMany({
      where,
      skip: p.page && p.perPage ? (p.page - 1) * p.perPage : undefined,
      take: p.page && p.perPage ? p.perPage : undefined,
      orderBy: p.sortBy
        ? {
            [p.sortByProperty ? p.sortByProperty : 'id_visible']: p.sortBy,
          }
        : undefined,
      include: {
        uploadUser: {
          select: { name: true, last_name: true, id: true, username: true },
        },
        city: true,
      },
    });

    // Retornamos la data
    return {
      data,
      metadata:
        p.page && p.perPage
          ? {
              page: p.page,
              totalRecords: await this.neighborhood.count({ where }),
              lastPage: Math.ceil(
                (await this.neighborhood.count({ where })) / p.perPage,
              ),
            }
          : {
              totalRecords: await this.neighborhood.count({ where }),
            },
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.neighborhood.findFirst({
      where: { id },
      include: {
        uploadUser: {
          select: { name: true, last_name: true, id: true, username: true },
        },
        city: true,
      },
    });
  }

  @Patch(":id")
  update(@Param('id') id: string, @Body() data: Partial<CreateNeighborhoodDto>) {
    return this.neighborhood.update({
      data: {
        ...data,
      },
      where: { id },
      include: {
        uploadUser: {
          select: { name: true, last_name: true, id: true, username: true },
        },
        city: true,
      },
    })
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.findOne(id);
    return this.update(id, { deleted: true, deletedAt: new Date() });
  }
}

