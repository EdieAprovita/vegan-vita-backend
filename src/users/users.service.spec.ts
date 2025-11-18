import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: any;

  beforeEach(async () => {
    mockUserRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: '1', email: 'test@example.com' }];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const user = { id: '1', email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const user = { id: '1', email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const hashedPassword = 'hashedPassword';
      const savedUser = { ...registerDto, id: '1', password: hashedPassword };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(savedUser);
      expect(result).toEqual(savedUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto = { name: 'Updated Name' };
      const user = { id: '1', name: 'Old Name' };
      const updatedUser = { ...user, ...updateUserDto };

      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.merge.mockReturnValue(updatedUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockUserRepository.merge).toHaveBeenCalledWith(user, updateUserDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should hash password if provided in update', async () => {
      const updateUserDto = { password: 'newPassword' };
      const user = { id: '1', password: 'oldHashedPassword' };
      const hashedPassword = 'newHashedPassword';
      const updatedUser = { ...user, password: hashedPassword };

      mockUserRepository.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      mockUserRepository.merge.mockReturnValue(updatedUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(mockUserRepository.merge).toHaveBeenCalledWith(user, {
        password: hashedPassword,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const user = { id: '1', email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(user);

      await service.remove('1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
    });
  });
});
