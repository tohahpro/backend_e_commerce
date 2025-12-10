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

const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  return categories;
};

const getSingleCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  return category;
};

const deleteCategory = async (id: string) => {
  const deleted = await prisma.category.delete({
    where: { id },
  });

  return deleted;
};


export const CategoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  deleteCategory
};
