export interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
  stock?: number | null;
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
  discount?: number;
}

export interface Sale {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  items: SaleItem[];
  created_at: string;
  payment_mode?: string;
  is_credit?: boolean;
}

export interface Credit {
  id: number;
  sale_id: number;
  customer_name: string;
  customer_phone: string;
  amount: number;
  paid: number;
  created_at: string;
  notes?: string;
}
