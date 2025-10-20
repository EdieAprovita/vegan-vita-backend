import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProduct = {
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    price: 100,
    stock: 10,
    image: 'test.jpg',
    category: { id: '1', name: 'Test Category' },
    reviews: [],
  };

  const mockCategory = {
    id: 'cat-1',
    name: 'Test Category',
    slug: 'test-category',
    products: [mockProduct],
  };

  const mockReview = {
    id: 'review-1',
    rating: 5,
    comment: 'Great product',
    author: { id: 'user-1', name: 'User 1' },
  };

  const mockProductsService = {
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findReviews: jest.fn(),
    findAllCategories: jest.fn(),
    findCategoryById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createReview: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockResponse = {
        data: [mockProduct],
        meta: { total: 1, page: 1, limit: 10, pages: 1 },
      };

      mockProductsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll({
        page: 1,
        limit: 10,
        search: '',
        categoryId: '',
        minPrice: 0,
        maxPrice: 0,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should pass filter parameters to service', async () => {
      const mockResponse = {
        data: [mockProduct],
        meta: { total: 1, page: 1, limit: 10, pages: 1 },
      };

      mockProductsService.findAll.mockResolvedValue(mockResponse);

      const filterDto = {
        page: 2,
        limit: 20,
        search: 'protein',
        categoryId: 'cat-1',
        minPrice: 50,
        maxPrice: 150,
        sortBy: 'price',
        sortOrder: 'ASC' as const,
      };

      await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      mockProductsService.findBySlug.mockResolvedValue(mockProduct);

      const result = await controller.findBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(service.findBySlug).toHaveBeenCalledWith('test-product');
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [mockCategory];

      mockProductsService.findAllCategories.mockResolvedValue(mockCategories);

      const result = await controller.findAllCategories();

      expect(result).toEqual(mockCategories);
      expect(service.findAllCategories).toHaveBeenCalled();
    });
  });

  describe('findReviews', () => {
    it('should return reviews for product', async () => {
      const mockReviews = [mockReview];

      mockProductsService.findReviews.mockResolvedValue(mockReviews);

      const result = await controller.findReviews('prod-1');

      expect(result).toEqual(mockReviews);
      expect(service.findReviews).toHaveBeenCalledWith('prod-1');
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'New Product',
        description: 'Test description',
        price: 50,
        stock: 20,
        image: 'new.jpg',
        categoryId: 'cat-1',
      };

      mockProductsService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto = {
        name: 'Updated Product',
        price: 75,
      };

      const updatedProduct = { ...mockProduct, ...updateProductDto };
      mockProductsService.update.mockResolvedValue(updatedProduct);

      const result = await controller.update('1', updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(service.update).toHaveBeenCalledWith('1', updateProductDto);
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      const mockResponse = { message: 'Producto eliminado correctamente' };

      mockProductsService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove('1');

      expect(result).toEqual(mockResponse);
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });

  describe('createReview', () => {
    it('should create a review for product', async () => {
      const createReviewDto = {
        rating: 5,
        comment: 'Great product',
      };

      const mockRequest = {
        user: { id: 'user-1', name: 'User 1', email: 'user@example.com' },
      };

      mockProductsService.createReview.mockResolvedValue(mockReview);

      const result = await controller.createReview(
        'prod-1',
        createReviewDto,
        mockRequest,
      );

      expect(result).toEqual(mockReview);
      expect(service.createReview).toHaveBeenCalledWith(
        'prod-1',
        createReviewDto,
        mockRequest.user,
      );
    });
  });
});
