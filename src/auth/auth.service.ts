import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email } = registerDto;

    // Verificar si el usuario ya existe
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Crear el nuevo usuario (UsersService se encarga del hashing)
    const user = await this.usersService.create(registerDto);

    // Generar JWT
    const token = this.jwtService.sign(
      { id: user.id, email: user.email },
      {
        secret: process.env.JWT_SECRET || 'vegan-vita-super-secret-key',
        expiresIn: '7d',
      },
    );

    // Retornar usuario sin contraseña y token
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar al usuario por email
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT
    const token = this.jwtService.sign(
      { id: user.id, email: user.email },
      {
        secret: process.env.JWT_SECRET || 'vegan-vita-super-secret-key',
        expiresIn: '7d',
      },
    );

    // Retornar usuario sin contraseña y token
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token: token,
    };
  }

  async validateUser(id: string): Promise<User | null> {
    return this.usersService.findOne(id);
  }
}
