export type Brand = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  logoUrl: string | null;
};

export type Product = {
  id: string;
  name: string;
  price: number;           // in dinars
  description: string | null;
  images: string[];        // first image is the cover
  videoUrl: string | null; // optional reel video
  category: string | null;
  variants: string[];      // e.g. sizes or colours; empty if none
  brand: Brand;
};

export type CartLine = {
  product: Product;
  variant: string | null;
  qty: number;
};
