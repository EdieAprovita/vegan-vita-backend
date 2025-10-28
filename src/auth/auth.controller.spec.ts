import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const expectedResult = {
        user: {
          id: '1',
          email: registerDto.email,
          name: registerDto.name,
        },
        token: 'jwt-token',
      };

      jest
        .spyOn(controller['authService'], 'register')
        .mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(controller['authService'].register).toHaveBeenCalledWith(
        registerDto,
      );
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResult = {
        user: {
          id: '1',
          email: loginDto.email,
          name: 'Test User',
        },
        token: 'jwt-token',
      };

      jest
        .spyOn(controller['authService'], 'login')
        .mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(controller['authService'].login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getMe', () => {
    it('should return current user information', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const req = { user };

      const result = await controller.getMe(req);

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    });
  });
});
