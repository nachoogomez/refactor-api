import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CreateCityDto } from './create-city.dto';
import { CityPaginatorDto } from './city-paginator.dto';
import { Owner } from '@/common/decorators/user.decorator';
import type { CityService } from './city.service';

@Controller("city")
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  create(@Body() data: CreateCityDto, @Owner() user: any) {
    return this.cityService.create(data, user.id)
  }

  @Get()
  findAll(@Query() params: CityPaginatorDto) {
    return this.cityService.findAll(params);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cityService.findOne(id);
  }

  @Patch(":id")
  update(@Param('id') id: string, @Body() data: Partial<CreateCityDto>) {
    return this.cityService.update(id, data)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cityService.remove(id);
  }
}

