export type Brand = {
  id: string;              // = merchants.id when reading Supabase
  name: string;
  slug: string;
  city: string | null;
  logoUrl: string | null;
};

export type Product = {
  id: string;
  name: string;
  price: number;           // in dinars
  compareAt: number | null;
  stock: number;
  description: string | null;
  images: string[];        // first image is the cover
  videoUrl: string | null; // optional reel video
  category: string | null; // category slug
  variants: string[];      // e.g. sizes or colours; empty if none
  variantIds: Record<string, string>;   // variant name -> product_variants.id (empty in mock mode)
  variantStock: Record<string, number>; // variant name -> units left (missing = not tracked per size)
  brand: Brand;
};

export type Category = { id: number | null; slug: string; label: string };

export type CartLine = {
  product: Product;
  variant: string | null;
  qty: number;
};

export type Address = {
  recipientName: string;
  phone: string;
  governorate: string;
  city: string;
  addressLine: string;
  notes: string;
};

export type Profile = {
  id: string;
  email: string | null;
  fullName: string;
  phone: string;
};

export type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "shipped"
  | "out_for_delivery" | "delivered" | "cancelled" | "returned";

export type OrderItem = {
  title: string;
  variant: string | null;
  qty: number;
  unitPrice: number;   // dinars
  lineTotal: number;   // dinars
};

export type OrderEvent = { status: string; note: string | null; at: string };

export type Order = {
  id: string;
  number: string;
  status: OrderStatus;
  createdAt: string;
  merchant: { id: string; name: string };
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  address: Address;
  courier: string | null;
  tracking: string | null;
  events: OrderEvent[];
};
