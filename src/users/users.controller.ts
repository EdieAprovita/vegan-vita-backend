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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'List all users (Admin)',
    description: 'Gets a list of all users in the system (administrators only)',
  })
  @ApiResponse({ status: 200, description: 'Users list retrieved successfully', type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Only administrators can perform this action' })
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map((user) => new UserResponseDto(user));
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Gets the profile information of the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    return new UserResponseDto(user);
  }

  @Put('profile')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates the profile information of the authenticated user',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
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
  @ApiOperation({
    summary: 'Get user by ID (Admin)',
    description: 'Gets the information of a specific user (administrators only)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Only administrators can perform this action' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id);
    return new UserResponseDto(user);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Update user (Admin)',
    description: 'Updates the information of a specific user (administrators only)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: String, format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Only administrators can perform this action' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return new UserResponseDto(user);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Delete user (Admin)',
    description: 'Deletes a user from the system (administrators only)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Only administrators can perform this action' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
