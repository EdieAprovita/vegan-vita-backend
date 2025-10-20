import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Review } from './entities/review.entity';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    price: 100,
    stock: 10,
  };

  const mockCategory = {
    id: '1',
    name: 'Test Category',
    slug: 'test-category',
  };

  const mockProductRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockCategoryRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockReviewRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBySlug', () => {
    it('should return a product by slug', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-product' },
        relations: ['category', 'reviews', 'reviews.author'],
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [mockCategory];
      mockCategoryRepository.find.mockResolvedValue(mockCategories);

      const result = await service.findAllCategories();

      expect(result).toEqual(mockCategories);
      expect(mockCategoryRepository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto = {
        name: 'New Product',
        description: 'Test description',
        price: 50,
        stock: 20,
        categoryId: '1',
      };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockProductRepository.findOne.mockResolvedValue(null);
      mockProductRepository.create.mockReturnValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createProductDto = {
        name: 'New Product',
        description: 'Test description',
        price: 50,
        stock: 20,
        categoryId: '1',
      };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.remove.mockResolvedValue(mockProduct);

      const result = await service.remove('1');

      expect(result).toHaveProperty('message');
      expect(mockProductRepository.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
