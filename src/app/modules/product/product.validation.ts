import { z } from "zod";

// VariantOption schema
const variantOptionSchema = z.object({
  size: z.string().nonempty("Size is required"),
  stock: z.number().int().nonnegative("Stock must be 0 or more"),
});

// ProductDescription schema
const productDescriptionSchema = z.object({
  intro: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
  outro: z.string().optional(),
});

const createProductSchema = z.object({
  title: z.string().nonempty("Title is required"),
  slug: z.string().nonempty("Slug is required"),
  price: z.number().nonnegative("Price must be 0 or more"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  images: z.array(z.string().url()).optional(),   // ⬅️ FIXED
  color: z.string().optional(),
  description: productDescriptionSchema.optional(),
  categories: z.array(z.string()).optional(),
  newArrival: z.boolean().optional(),
  variantOptions: z.array(variantOptionSchema).optional(),
});

const updateProductSchema = z.object({
  title: z.string().nonempty("Title is required").optional(),
  slug: z.string().nonempty("Slug is required").optional(),
  price: z.number().nonnegative("Price must be 0 or more").optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  images: z.array(z.string().url()).optional(),   // ⬅️ FIXED
  color: z.string().optional(),
  description: productDescriptionSchema.optional(),
  categories: z.array(z.string()).optional(),
  newArrival: z.boolean().optional(),
  variantOptions: z.array(variantOptionSchema).optional(),
});


export const ProductValidation = {
  createProductSchema,
  updateProductSchema
};
