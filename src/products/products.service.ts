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
import { User } from '../auth/entities/user.entity';

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

  // ==================== PRODUCTOS ====================

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

    // Búsqueda por nombre o descripción
    if (search) {
      query = query.where(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filtrar por categoría
    if (categoryId) {
      query = query.andWhere('product.categoryId = :categoryId', {
        categoryId,
      });
    }

    // Filtrar por rango de precio
    if (minPrice !== undefined) {
      query = query.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query = query.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Ordenamiento
    query = query.orderBy(`product.${sortBy}`, sortOrder);

    // Paginación
    const skip = (page - 1) * limit;
    query = query.skip(skip).take(limit);

    // Relaciones eager
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
      throw new NotFoundException(`Producto con slug "${slug}" no encontrado`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const { categoryId, name, ...rest } = createProductDto;

    // Generar slug automáticamente
    const slug = this.generateSlug(name);

    // Validar que la categoría existe
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Categoría con id "${categoryId}" no encontrada`,
      );
    }

    // Validar slug único
    const existingProduct = await this.productRepository.findOne({
      where: { slug },
    });

    if (existingProduct) {
      throw new ConflictException(`El slug "${slug}" ya está en uso`);
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
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }

    // Si cambia categoryId, validar que la nueva categoría existe
    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Categoría con id "${updateProductDto.categoryId}" no encontrada`,
        );
      }

      product.category = category;
    }

    // Actualizar otros campos
    Object.assign(product, updateProductDto);

    return await this.productRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }

    await this.productRepository.remove(product);
    return { message: 'Producto eliminado correctamente' };
  }

  // ==================== RESEÑAS ====================

  async findReviews(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con id "${productId}" no encontrado`,
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
        `Producto con id "${productId}" no encontrado`,
      );
    }

    // Validar que el usuario no haya dejado reseña duplicada
    const existingReview = await this.reviewRepository.findOne({
      where: {
        product: { id: productId },
        author: { id: user.id },
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'Ya has dejado una reseña para este producto',
      );
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      product,
      author: user,
    });

    return await this.reviewRepository.save(review);
  }

  // ==================== CATEGORÍAS ====================

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
      throw new NotFoundException(`Categoría con id "${id}" no encontrada`);
    }

    return category;
  }

  // ==================== UTILIDADES ====================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
}
