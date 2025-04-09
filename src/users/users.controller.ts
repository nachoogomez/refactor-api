import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query } from "@nestjs/common"
import type { CreateUserDto } from "./create-user.dto"
import type { UserPaginator } from "./user.paginator.dto"
import type { UsersService } from "./users.service"

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() params: UserPaginator) {
    return this.usersService.findAll(params);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: Partial<CreateUserDto>) {
    return this.usersService.update(id, updateUserDto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
