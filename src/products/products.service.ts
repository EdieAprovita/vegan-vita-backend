import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Review } from './entities/review.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  // ==================== PRODUCTS ====================

  async findAll(filterDto: FilterProductDto) {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    let query = this.productRepository.createQueryBuilder('product');

    // Search by name or description
    if (search) {
      query = query.where(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by category
    if (categoryId) {
      query = query.andWhere('product.categoryId = :categoryId', {
        categoryId,
      });
    }

    // Filter by price range
    if (minPrice !== undefined) {
      query = query.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query = query.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Sorting
    query = query.orderBy(`product.${sortBy}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    query = query.skip(skip).take(limit);

    // Eager relations
    query = query.leftJoinAndSelect('product.category', 'category');
    query = query.leftJoinAndSelect('product.reviews', 'reviews');

    const [products, total] = await query.getManyAndCount();

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['category', 'reviews', 'reviews.author'],
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const { categoryId, name, ...rest } = createProductDto;

    // Generate slug automatically
    const slug = this.generateSlug(name);

    // Validate that the category exists
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with id "${categoryId}" not found`,
      );
    }

    // Validate unique slug
    const existingProduct = await this.productRepository.findOne({
      where: { slug },
    });

    if (existingProduct) {
      throw new ConflictException(`Slug "${slug}" is already in use`);
    }

    const product = this.productRepository.create({
      ...rest,
      slug,
      category,
    });

    return await this.productRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    // If categoryId changes, validate that the new category exists
    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id "${updateProductDto.categoryId}" not found`,
        );
      }

      product.category = category;
    }

    // Update other fields
    Object.assign(product, updateProductDto);

    return await this.productRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    await this.productRepository.remove(product);
    return { message: 'Product deleted successfully' };
  }

  // ==================== REVIEWS ====================

  async findReviews(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id "${productId}" not found`,
      );
    }

    return await this.reviewRepository.find({
      where: { product: { id: productId } },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async createReview(
    productId: string,
    createReviewDto: CreateReviewDto,
    user: User,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id "${productId}" not found`,
      );
    }

    // Validate that the user has not already left a duplicate review
    const existingReview = await this.reviewRepository.findOne({
      where: {
        product: { id: productId },
        author: { id: user.id },
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'You have already left a review for this product',
      );
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      product,
      author: user,
    });

    return await this.reviewRepository.save(review);
  }

  // ==================== CATEGORIES ====================

  async findAllCategories() {
    return await this.categoryRepository.find({
      relations: ['products'],
      order: { name: 'ASC' },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    return category;
  }

  // ==================== UTILITIES ====================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
}
