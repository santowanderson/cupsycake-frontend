export interface OrderItem {
  id: number;
  slug: string;
  product_id: number;
  product_name: string;
  image_url: string;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: number;
  created_at: string;
  shipping_fee: number;
  total_amount: number;
  status: string;
  notes?: string | null;
  items: OrderItem[];
}
