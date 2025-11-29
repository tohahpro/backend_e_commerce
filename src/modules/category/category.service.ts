import { PrismaClient } from "@prisma/client";

interface CreateCategoryPayload {
  name: string;
  slug: string;
}

const prisma = new PrismaClient();

const createCategory = async (payload: CreateCategoryPayload) => {
  // Prisma create method
  const category = await prisma.category.create({
    data: {
      name: payload.name,
      slug: payload.slug
    },
  });

  return category;
};

export const CategoryService = {
  createCategory,
};
