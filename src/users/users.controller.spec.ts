import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: any;

  beforeEach(async () => {
    mockUsersService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of user response dtos', async () => {
      const users = [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as User,
      ];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(UserResponseDto);
      expect(result[0].email).toBe(users[0].email);
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      mockUsersService.findOne.mockResolvedValue(user);

      const req = { user: { id: '1' } };
      const result = await controller.getProfile(req);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toBe(user.id);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('updateProfile', () => {
    it('should update the current user profile', async () => {
      const updateUserDto = { name: 'Updated Name' };
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      mockUsersService.update.mockResolvedValue(user);

      const req = { user: { id: '1' } };
      const result = await controller.updateProfile(req, updateUserDto);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.name).toBe('Updated Name');
      expect(mockUsersService.update).toHaveBeenCalledWith('1', updateUserDto);
    });

    it('should remove isAdmin from update dto', async () => {
      const updateUserDto = { isAdmin: true, name: 'Hacker' };
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Hacker',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      mockUsersService.update.mockResolvedValue(user);

      const req = { user: { id: '1' } };
      await controller.updateProfile(req, updateUserDto);

      expect(mockUsersService.update).toHaveBeenCalledWith('1', {
        name: 'Hacker',
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne('1');

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toBe('1');
    });
  });

  describe('update', () => {
    it('should update a user by id', async () => {
      const updateUserDto = { isAdmin: true };
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      mockUsersService.update.mockResolvedValue(user);

      const result = await controller.update('1', updateUserDto);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.isAdmin).toBe(true);
      expect(mockUsersService.update).toHaveBeenCalledWith('1', updateUserDto);
    });
  });

  describe('remove', () => {
    it('should remove a user by id', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('1');

      expect(mockUsersService.remove).toHaveBeenCalledWith('1');
    });
  });
});
