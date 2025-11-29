/**
 * Product Schema Types
 * TypeScript interfaces matching the JSON product structure
 */

export interface ProductDescription {
  id: string;
  intro: string;
  bulletPoints: string[];
  outro: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
}

export interface SizeOption {
  id: string;
  size: string;
  stock: number;
}

export interface ProductVariant {
  id: string;
  color: string;
  stock: number;
  sizeOptions: SizeOption[];
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: ProductDescription;
  price: number;
  sku: string;
  barcode: string;
  categories: Category[];
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}

