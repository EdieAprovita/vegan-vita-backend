import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Review } from './entities/review.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { User } from '../auth/entities/user.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockProductRepository: any;
  let mockCategoryRepository: any;
  let mockReviewRepository: any;
  let createMockQueryBuilder: () => any;

  beforeEach(async () => {
    createMockQueryBuilder = () => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    });

    mockProductRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockCategoryRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    mockReviewRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

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

  describe('findAll', () => {
    it('should return paginated products with filters', async () => {
      const filterDto = {
        search: 'test',
        categoryId: '1',
        minPrice: 10,
        maxPrice: 100,
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC' as const,
      };

      const products = [
        {
          id: '1',
          name: 'Test Product',
          price: 50,
          category: { id: '1', name: 'Category 1' },
        },
      ];

      const mockQueryBuilder = createMockQueryBuilder();
      mockProductRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([products, 1]);

      const result = await service.findAll(filterDto);

      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalled();
      expect(mockQueryBuilder.take).toHaveBeenCalled();
      expect(result).toEqual({
        data: products,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
    });

    it('should return products without filters', async () => {
      const filterDto = {};
      const products = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ];

      const mockQueryBuilder = createMockQueryBuilder();
      mockProductRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([products, 2]);

      const result = await service.findAll(filterDto);

      expect(result.data).toEqual(products);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      const slug = 'test-product';
      const product = {
        id: '1',
        slug,
        name: 'Test Product',
        category: { id: '1', name: 'Category' },
        reviews: [],
      };

      mockProductRepository.findOne.mockResolvedValue(product);

      const result = await service.findBySlug(slug);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { slug },
        relations: ['category', 'reviews', 'reviews.author'],
      });
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if product not found', async () => {
      const slug = 'nonexistent';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySlug(slug)).rejects.toThrow(NotFoundException);
      await expect(service.findBySlug(slug)).rejects.toThrow(
        `Producto con slug "${slug}" no encontrado`,
      );
    });
  });

  describe('create', () => {
    it('should successfully create a product', async () => {
      const createProductDto = {
        name: 'New Product',
        description: 'Description',
        price: 100,
        stock: 50,
        categoryId: '1',
        image: 'http://example.com/image.jpg',
      };

      const category = { id: '1', name: 'Category' };
      const product = {
        id: '1',
        slug: 'new-product',
        ...createProductDto,
        category,
      };

      mockCategoryRepository.findOne.mockResolvedValue(category);
      mockProductRepository.findOne.mockResolvedValue(null); // No existing product with same slug
      mockProductRepository.create.mockReturnValue(product);
      mockProductRepository.save.mockResolvedValue(product);

      const result = await service.create(createProductDto);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: createProductDto.categoryId },
      });
      expect(mockProductRepository.create).toHaveBeenCalled();
      expect(mockProductRepository.save).toHaveBeenCalled();
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException if category not found', async () => {
      const createProductDto = {
        name: 'New Product',
        description: 'Description',
        price: 100,
        stock: 50,
        categoryId: 'nonexistent',
        image: 'http://example.com/image.jpg',
      };

      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createProductDto)).rejects.toThrow(
        `Categoría con id "${createProductDto.categoryId}" no encontrada`,
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createProductDto = {
        name: 'Existing Product',
        description: 'Description',
        price: 100,
        stock: 50,
        categoryId: '1',
        image: 'http://example.com/image.jpg',
      };

      const category = { id: '1', name: 'Category' };
      const existingProduct = {
        id: '2',
        slug: 'existing-product',
        name: 'Existing Product',
      };

      mockCategoryRepository.findOne.mockResolvedValue(category);
      mockProductRepository.findOne.mockResolvedValue(existingProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should successfully update a product', async () => {
      const productId = '1';
      const updateProductDto = {
        name: 'Updated Product',
        price: 150,
      };

      const existingProduct = {
        id: productId,
        name: 'Old Product',
        price: 100,
        category: { id: '1', name: 'Category' },
      };

      mockProductRepository.findOne.mockResolvedValue(existingProduct);
      mockProductRepository.save.mockResolvedValue({
        ...existingProduct,
        ...updateProductDto,
      });

      const result = await service.update(productId, updateProductDto);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockProductRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateProductDto.name);
      expect(result.price).toBe(updateProductDto.price);
    });

    it('should throw NotFoundException if product not found', async () => {
      const productId = 'nonexistent';
      const updateProductDto = { name: 'Updated Product' };

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.update(productId, updateProductDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(productId, updateProductDto)).rejects.toThrow(
        `Producto con id "${productId}" no encontrado`,
      );
    });

    it('should update category if categoryId is provided', async () => {
      const productId = '1';
      const updateProductDto = {
        categoryId: '2',
      };

      const existingProduct = {
        id: productId,
        name: 'Product',
        category: { id: '1', name: 'Old Category' },
      };

      const newCategory = { id: '2', name: 'New Category' };

      mockProductRepository.findOne.mockResolvedValue(existingProduct);
      mockCategoryRepository.findOne.mockResolvedValue(newCategory);
      mockProductRepository.save.mockResolvedValue({
        ...existingProduct,
        category: newCategory,
      });

      const result = await service.update(productId, updateProductDto);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: updateProductDto.categoryId },
      });
      expect(result.category).toEqual(newCategory);
    });

    it('should throw NotFoundException if new category not found', async () => {
      const productId = '1';
      const updateProductDto = {
        categoryId: 'nonexistent',
      };

      const existingProduct = {
        id: productId,
        name: 'Product',
        category: { id: '1', name: 'Old Category' },
      };

      mockProductRepository.findOne.mockResolvedValue(existingProduct);
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update(productId, updateProductDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should successfully remove a product', async () => {
      const productId = '1';
      const product = { id: productId, name: 'Product to Delete' };

      mockProductRepository.findOne.mockResolvedValue(product);
      mockProductRepository.remove.mockResolvedValue(product);

      const result = await service.remove(productId);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockProductRepository.remove).toHaveBeenCalledWith(product);
      expect(result).toEqual({ message: 'Producto eliminado correctamente' });
    });

    it('should throw NotFoundException if product not found', async () => {
      const productId = 'nonexistent';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(productId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(productId)).rejects.toThrow(
        `Producto con id "${productId}" no encontrado`,
      );
    });
  });

  describe('findReviews', () => {
    it('should return reviews for a product', async () => {
      const productId = '1';
      const product = { id: productId, name: 'Product' };
      const reviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Great!',
          author: { id: '1', name: 'User' },
        },
      ];

      mockProductRepository.findOne.mockResolvedValue(product);
      mockReviewRepository.find.mockResolvedValue(reviews);

      const result = await service.findReviews(productId);

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        where: { product: { id: productId } },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(reviews);
    });

    it('should throw NotFoundException if product not found', async () => {
      const productId = 'nonexistent';

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.findReviews(productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createReview', () => {
    it('should successfully create a review', async () => {
      const productId = '1';
      const createReviewDto = {
        rating: 5,
        comment: 'Excellent product!',
      };
      const user = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
      } as User;

      const product = { id: productId, name: 'Product' };
      const review = {
        id: '1',
        ...createReviewDto,
        product,
        author: user,
      };

      mockProductRepository.findOne.mockResolvedValue(product);
      mockReviewRepository.findOne.mockResolvedValue(null); // No existing review
      mockReviewRepository.create.mockReturnValue(review);
      mockReviewRepository.save.mockResolvedValue(review);

      const result = await service.createReview(
        productId,
        createReviewDto,
        user,
      );

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId },
      });
      expect(mockReviewRepository.findOne).toHaveBeenCalledWith({
        where: {
          product: { id: productId },
          author: { id: user.id },
        },
      });
      expect(mockReviewRepository.create).toHaveBeenCalledWith({
        ...createReviewDto,
        product,
        author: user,
      });
      expect(result).toEqual(review);
    });

    it('should throw NotFoundException if product not found', async () => {
      const productId = 'nonexistent';
      const createReviewDto = { rating: 5, comment: 'Great!' };
      const user = { id: '1', email: 'user@example.com', name: 'User' } as User;

      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createReview(productId, createReviewDto, user),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already reviewed the product', async () => {
      const productId = '1';
      const createReviewDto = { rating: 5, comment: 'Great!' };
      const user = { id: '1', email: 'user@example.com', name: 'User' } as User;

      const product = { id: productId, name: 'Product' };
      const existingReview = {
        id: '1',
        rating: 4,
        comment: 'Good',
        product,
        author: user,
      };

      mockProductRepository.findOne.mockResolvedValue(product);
      mockReviewRepository.findOne.mockResolvedValue(existingReview);

      await expect(
        service.createReview(productId, createReviewDto, user),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createReview(productId, createReviewDto, user),
      ).rejects.toThrow('Ya has dejado una reseña para este producto');
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories', async () => {
      const categories = [
        { id: '1', name: 'Category 1', products: [] },
        { id: '2', name: 'Category 2', products: [] },
      ];

      mockCategoryRepository.find.mockResolvedValue(categories);

      const result = await service.findAllCategories();

      expect(mockCategoryRepository.find).toHaveBeenCalledWith({
        relations: ['products'],
        order: { name: 'ASC' },
      });
      expect(result).toEqual(categories);
    });
  });

  describe('findCategoryById', () => {
    it('should return category by id', async () => {
      const categoryId = '1';
      const category = {
        id: categoryId,
        name: 'Category',
        products: [],
      };

      mockCategoryRepository.findOne.mockResolvedValue(category);

      const result = await service.findCategoryById(categoryId);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryId },
        relations: ['products'],
      });
      expect(result).toEqual(category);
    });

    it('should throw NotFoundException if category not found', async () => {
      const categoryId = 'nonexistent';

      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findCategoryById(categoryId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findCategoryById(categoryId)).rejects.toThrow(
        `Categoría con id "${categoryId}" no encontrada`,
      );
    });
  });
});
