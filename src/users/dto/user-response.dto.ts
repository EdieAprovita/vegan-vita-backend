import { Exclude } from 'class-transformer';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.isAdmin = user.isAdmin;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
