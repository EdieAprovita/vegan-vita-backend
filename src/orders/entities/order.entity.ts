import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  BaseEntity,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from './order-status.enum';

@Entity('orders')
@Index(['userId'])
@Index(['status'])
@Index(['createdAt'])
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => OrderItem, (item) => item.order, {
    eager: true,
    cascade: true,
  })
  orderItems: OrderItem[];

  @Column({ type: 'jsonb' })
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentResult: {
    id?: string;
    status?: string;
    update_time?: string;
    email_address?: string;
  } | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  @Index()
  stripePaymentIntentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripePaymentStatus: string | null;

  @Column({ type: 'boolean', default: false })
  isRefunded: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  itemsPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isDelivered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
