export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  ingredients?: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  image_url: string;
  tags: Tag[];
  created_at: string;
}
