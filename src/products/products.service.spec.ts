import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Review } from './entities/review.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockCategory = {
    id: 'cat-123',
    name: 'Proteínas Vegetales',
    slug: 'proteinas-vegetales',
    description: 'Proteínas de origen vegetal',
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    price: 100,
    stock: 10,
    image: 'test.jpg',
    category: mockCategory,
    reviews: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    password: 'hashed',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReview = {
    id: 'review-123',
    rating: 5,
    comment: 'Excelente producto',
    product: mockProduct,
    author: mockUser,
    createdAt: new Date(),
  };

  const mockProductRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    find: jest.fn(),
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
    jest.clearAllMocks();

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products with meta', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      mockProductRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAll({
        page: 1,
        limit: 10,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual([mockProduct]);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.pages).toBe(1);
    });

    it('should use default pagination if not provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      mockProductRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.findAll({});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); // (1-1)*10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should apply search filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      mockProductRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.findAll({ search: 'Proteína' });

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should apply category filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      mockProductRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.findAll({ categoryId: 'cat-123' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should apply price range filters', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      };

      mockProductRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      await service.findAll({
        minPrice: 50,
        maxPrice: 150,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
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
      expect(mockCategoryRepository.find).toHaveBeenCalledWith({
        relations: ['products'],
        order: { name: 'ASC' },
      });
    });

    it('should return empty array if no categories exist', async () => {
      mockCategoryRepository.find.mockResolvedValue([]);

      const result = await service.findAllCategories();

      expect(result).toEqual([]);
    });
  });

  describe('findCategoryById', () => {
    it('should return category by id', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findCategoryById('cat-123');

      expect(result).toEqual(mockCategory);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-123' },
        relations: ['products'],
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findCategoryById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto: CreateProductDto = {
        name: 'New Product',
        description: 'Test description',
        price: 50,
        stock: 20,
        image: 'new.jpg',
        categoryId: 'cat-123',
      };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockProductRepository.findOne.mockResolvedValue(null);
      mockProductRepository.create.mockReturnValue(mockProduct);
      mockProductRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-123' },
      });
      expect(mockProductRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      const createProductDto: CreateProductDto = {
        name: 'New Product',
        description: 'Test description',
        price: 50,
        stock: 20,
        image: 'new.jpg',
        categoryId: 'nonexistent-cat',
      };

      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createProductDto: CreateProductDto = {
        name: 'New Product',
        description: 'Test description',
        price: 50,
        stock: 20,
        image: 'new.jpg',
        categoryId: 'cat-123',
      };

      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockProductRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        price: 75,
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockProductRepository.save.mockResolvedValue({
        ...mockProduct,
        price: 75,
      });

      await service.update('1', updateProductDto);

      expect(mockProductRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if new category not found', async () => {
      const updateProductDto: UpdateProductDto = {
        categoryId: 'nonexistent-cat',
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', updateProductDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should update category if categoryId is provided', async () => {
      const newCategory = {
        id: 'cat-456',
        name: 'New Category',
      };
      const updateProductDto: UpdateProductDto = {
        categoryId: 'cat-456',
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockCategoryRepository.findOne.mockResolvedValue(newCategory);
      mockProductRepository.save.mockResolvedValue(mockProduct);

      await service.update('1', updateProductDto);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cat-456' },
      });
      expect(mockProductRepository.save).toHaveBeenCalled();
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
      expect(mockProductRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('findReviews', () => {
    it('should return reviews for a product', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockReviewRepository.find.mockResolvedValue([mockReview]);

      const result = await service.findReviews('1');

      expect(result).toEqual([mockReview]);
      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        where: { product: { id: '1' } },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findReviews('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array if product has no reviews', async () => {
      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockReviewRepository.find.mockResolvedValue([]);

      const result = await service.findReviews('1');

      expect(result).toEqual([]);
    });
  });

  describe('createReview', () => {
    it('should create a review for a product', async () => {
      const createReviewDto: CreateReviewDto = {
        rating: 5,
        comment: 'Excelente producto',
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockReviewRepository.findOne.mockResolvedValue(null);
      mockReviewRepository.create.mockReturnValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);

      const result = await service.createReview('1', createReviewDto, mockUser);

      expect(result).toEqual(mockReview);
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product not found', async () => {
      const createReviewDto: CreateReviewDto = {
        rating: 5,
        comment: 'Excelente producto',
      };

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createReview('non-existent', createReviewDto, mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if user already reviewed product', async () => {
      const createReviewDto: CreateReviewDto = {
        rating: 5,
        comment: 'Excelente producto',
      };

      mockProductRepository.findOne.mockResolvedValue(mockProduct);
      mockReviewRepository.findOne.mockResolvedValue(mockReview);

      await expect(
        service.createReview('1', createReviewDto, mockUser),
      ).rejects.toThrow(ConflictException);
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });
  });
});
