import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProductsService = {
    findAll: jest.fn(),
    findBySlug: jest.fn(),
    findReviews: jest.fn(),
    findAllCategories: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createReview: jest.fn(),
  };

  beforeEach(async () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, pages: 0 },
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
  });

  describe('findBySlug', () => {
    it('should return product by slug', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
      };

      mockProductsService.findBySlug.mockResolvedValue(mockProduct);

      const result = await controller.findBySlug('test-product');

      expect(result).toEqual(mockProduct);
      expect(service.findBySlug).toHaveBeenCalledWith('test-product');
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1', slug: 'category-1' },
      ];

      mockProductsService.findAllCategories.mockResolvedValue(mockCategories);

      const result = await controller.findAllCategories();

      expect(result).toEqual(mockCategories);
      expect(service.findAllCategories).toHaveBeenCalled();
    });
  });
});
