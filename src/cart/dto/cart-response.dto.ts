export class CartResponseDto {
  id: string;
  items: {
    id: string;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      image: string;
      stock: number;
    };
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  itemCount: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
