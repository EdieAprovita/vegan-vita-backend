import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const savedUser = {
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        password: 'hashedPassword123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: savedUser.id, email: savedUser.email },
        {
          secret: expect.any(String),
          expiresIn: '7d',
        },
      );
      expect(result).toEqual({
        user: {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
        },
        access_token: 'jwt-token',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const existingUser = {
        id: '1',
        email: registerDto.email,
        name: 'Existing User',
        password: 'hashedPassword',
      };

      mockUsersService.findByEmail.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'El email ya está registrado',
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login a user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: loginDto.email,
        name: 'Test User',
        password: 'hashedPassword123',
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: user.id, email: user.email },
        {
          secret: expect.any(String),
          expiresIn: '7d',
        },
      );
      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        access_token: 'jwt-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: '1',
        email: loginDto.email,
        name: 'Test User',
        password: 'hashedPassword123',
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const userId = '1';
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
      };

      mockUsersService.findOne.mockResolvedValue(user);

      const result = await service.validateUser(userId);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const userId = 'nonexistent';

      mockUsersService.findOne.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });
});
