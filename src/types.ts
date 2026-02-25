export interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
}

export interface Settings {
  shop_name: string;
  address: string;
  phone: string;
  email: string;
  gst_number: string;
}

export interface SaleItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: number;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  items: SaleItem[];
  created_at: string;
}
