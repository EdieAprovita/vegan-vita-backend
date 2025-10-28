import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product, Category, Review } from './entities';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCategoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockReviewRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
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

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products with pagination', async () => {
      const filterDto = { page: 1, limit: 10 };
      const expectedResult = {
        data: [
          {
            id: '1',
            name: 'Product 1',
            slug: 'product-1',
            description: 'Description',
            price: 100,
            stock: 50,
            image: 'image.jpg',
            category: null,
            reviews: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
        ],
        meta: { total: 1, page: 1, limit: 10, pages: 1 },
      };

      jest
        .spyOn(controller['productsService'], 'findAll')
        .mockResolvedValue(expectedResult);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(expectedResult);
      expect(controller['productsService'].findAll).toHaveBeenCalledWith(
        filterDto,
      );
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories', async () => {
      const expectedResult = [
        {
          id: '1',
          name: 'Category 1',
          slug: 'category-1',
          description: 'Description',
          products: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
        {
          id: '2',
          name: 'Category 2',
          slug: 'category-2',
          description: 'Description',
          products: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      jest
        .spyOn(controller['productsService'], 'findAllCategories')
        .mockResolvedValue(expectedResult);

      const result = await controller.findAllCategories();

      expect(result).toEqual(expectedResult);
      expect(
        controller['productsService'].findAllCategories,
      ).toHaveBeenCalled();
    });
  });

  describe('findBySlug', () => {
    it('should return a product by slug', async () => {
      const slug = 'test-product';
      const expectedResult = {
        id: '1',
        slug,
        name: 'Test Product',
        description: 'Description',
        price: 100,
        stock: 50,
        image: 'image.jpg',
        category: null,
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      jest
        .spyOn(controller['productsService'], 'findBySlug')
        .mockResolvedValue(expectedResult);

      const result = await controller.findBySlug(slug);

      expect(result).toEqual(expectedResult);
      expect(controller['productsService'].findBySlug).toHaveBeenCalledWith(
        slug,
      );
    });
  });

  describe('findReviews', () => {
    it('should return reviews for a product', async () => {
      const productId = '1';
      const expectedResult = [
        {
          id: '1',
          rating: 5,
          comment: 'Great!',
          product: null,
          author: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any,
      ];

      jest
        .spyOn(controller['productsService'], 'findReviews')
        .mockResolvedValue(expectedResult);

      const result = await controller.findReviews(productId);

      expect(result).toEqual(expectedResult);
      expect(controller['productsService'].findReviews).toHaveBeenCalledWith(
        productId,
      );
    });
  });

  describe('createReview', () => {
    it('should create a review for a product', async () => {
      const productId = '1';
      const createReviewDto = { rating: 5, comment: 'Excellent!' };
      const user = { id: '1', email: 'user@example.com', name: 'User' };
      const req = { user };

      const expectedResult = {
        id: '1',
        ...createReviewDto,
        product: null,
        author: user as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      jest
        .spyOn(controller['productsService'], 'createReview')
        .mockResolvedValue(expectedResult);

      const result = await controller.createReview(
        productId,
        createReviewDto,
        req,
      );

      expect(result).toEqual(expectedResult);
      expect(controller['productsService'].createReview).toHaveBeenCalledWith(
        productId,
        createReviewDto,
        user,
      );
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'New Product',
        description: 'Description',
        price: 100,
        stock: 50,
        categoryId: '1',
        image: 'http://example.com/image.jpg',
      };

      const expectedResult = {
        id: '1',
        slug: 'new-product',
        ...createProductDto,
        category: null,
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      jest
        .spyOn(controller['productsService'], 'create')
        .mockResolvedValue(expectedResult);

      const result = await controller.create(createProductDto);

      expect(result).toEqual(expectedResult);
      expect(controller['productsService'].create).toHaveBeenCalledWith(
        createProductDto,
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const productId = '1';
      const updateProductDto = { name: 'Updated Product', price: 150 };

      const expectedResult = {
        id: productId,
        slug: 'updated-product',
        description: 'Description',
        stock: 50,
        image: 'image.jpg',
        category: null,
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...updateProductDto,
      } as any;

      jest
        .spyOn(controller['productsService'], 'update')
        .mockResolvedValue(expectedResult);

      const result = await controller.update(productId, updateProductDto);

      expect(result).toEqual(expectedResult);
      expect(controller['productsService'].update).toHaveBeenCalledWith(
        productId,
        updateProductDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const productId = '1';
      const expectedResult = { message: 'Producto eliminado correctamente' };

      jest
        .spyOn(controller['productsService'], 'remove')
        .mockResolvedValue(expectedResult);

      const result = await controller.remove(productId);

      expect(result).toEqual(expectedResult);
      expect(controller['productsService'].remove).toHaveBeenCalledWith(
        productId,
      );
    });
  });
});
