import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => new UserResponseDto(user));
  }

  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    return new UserResponseDto(user);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    // Prevent users from making themselves admin
    if (updateUserDto.isAdmin !== undefined) {
      delete updateUserDto.isAdmin;
    }
    
    const user = await this.usersService.update(req.user.id, updateUserDto);
    return new UserResponseDto(user);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id);
    return new UserResponseDto(user);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return new UserResponseDto(user);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
