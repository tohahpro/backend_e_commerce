import { Request } from "express";
import { fileUploader } from "../../helper/fileUploader";
import { Prisma, PrismaClient } from "@prisma/client";
import { paginationHelper } from "../../helper/paginationHelper";
import ApiError from "../../errors/ApiError";
import { productSearchableFields } from "./product.constant";


const prisma = new PrismaClient();


const createProduct = async (req: Request) => {
    const data = req.body;
    const files = req.files as Express.Multer.File[];

    let uploadedImages: string[] = [];

    // 1️⃣ Upload all images to cloudinary
    if (files && files.length > 0) {
        for (const file of files) {
            const upload = await fileUploader.uploadToCloudinary(file);
            if (upload?.secure_url) {
                uploadedImages.push(upload.secure_url);
            }
        }
    }

    // 2️⃣ Add images from the database + uploaded
    if (!data.images) data.images = [];
    data.images = [...data.images, ...uploadedImages];

    const {
        title,
        slug,
        price,
        sku,
        barcode,
        images,
        color,
        description,
        variantOptions,
        categories,
        newArrival
    } = data;


    // ⭐ Transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create Product
        const product = await tx.product.create({
            data: {
                title,
                slug,
                price,
                sku,
                barcode,
                color,
                images,
                newArrival
            },
        });

        // Create Description
        if (description) {
            await tx.productDescription.create({
                data: {
                    productId: product.id,
                    intro: description.intro,
                    bulletPoints: description.bulletPoints || [],
                    outro: description.outro,
                },
            });
        }

        // Create Variant Options
        if (variantOptions && variantOptions.length > 0) {
            for (const v of variantOptions) {
                await tx.variantOption.create({
                    data: {
                        size: v.size,
                        stock: v.stock,
                        productId: product.id,
                    },
                });
            }
        }

        // Create Categories
        if (categories && categories.length > 0) {
            for (const categoryId of categories) {
                await tx.productCategory.create({
                    data: {
                        productId: product.id,
                        categoryId,
                    },
                });
            }
        }

        return product;
    });

    return result;
};


const getAllProducts = async (params: any, options: any) => {
    // Pagination
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

    const { searchValue, categories, ...filterData } = params;


    const andConditions: Prisma.ProductWhereInput[] = [];

    // Search conditions
    if (searchValue) {
        andConditions.push({
            OR: productSearchableFields.map((field) => ({
                [field]: {
                    contains: searchValue,
                    mode: "insensitive"
                }
            }))
        })
    }

    if (categories && categories.length > 0) {
        andConditions.push({
            productCategory: {
                some: {
                    category: {
                        name: {
                            contains: categories,
                            mode: "insensitive"
                        }
                    }
                }
            }
        })
    }

    if (Object.keys(filterData).length > 0) {
        const filterConditions = Object.keys(filterData).map((key) => ({
            [key]: {
                equals: (filterData as any)[key]
            }
        }))

        andConditions.push(...filterConditions)
    }

    const whereConditions: Prisma.ProductWhereInput = andConditions.length > 0 ? { AND: andConditions } : {}


    // Get data
    const products = await prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder
        },
        include: {
            productCategory: {
                include: {
                    category: true
                }
            },
            description: true,
            variantOption: true,
        },
    });

    // Count
    const total = await prisma.product.count({
        where: whereConditions,
    });

    return {
        meta: {
            page,
            limit,
            total,
        },
        data: products,
    };
};


const getProductBySlug = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      productCategory: {
        include: {
          category: true
        }
      },
      description: true,
      variantOption: true,
    },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return product;
};


const getProductById = async (id: string) => {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            productCategory: true,
            description: true,
            variantOption: true,
        },
    });
    return product;
};

const updateProduct = async (id: string, req: Request) => {
    const data = req.body;
    const files = req.files as Express.Multer.File[];

    // Parse body values if needed
    if (typeof data.categories === "string") {
        data.categories = JSON.parse(data.categories);
    }
    if (typeof data.variantOptions === "string") {
        data.variantOptions = JSON.parse(data.variantOptions);
    }
    if (typeof data.description === "string") {
        data.description = JSON.parse(data.description);
    }

    let uploadedImages: string[] = [];

    // 1️⃣ Upload new images
    if (Array.isArray(files) && files.length > 0) {
        for (const file of files) {
            const upload = await fileUploader.uploadToCloudinary(file);
            if (upload?.secure_url) uploadedImages.push(upload.secure_url);
        }
    }

    return await prisma.$transaction(async (tx) => {

        const existingProduct = await tx.product.findUnique({
            where: { id }
        });

        if (!existingProduct) throw new ApiError(404, "Product not found");

        // 3️⃣ Final images
        const finalImages = uploadedImages.length > 0
            ? uploadedImages
            : existingProduct.images;

        // 4️⃣ Update product
        const updatedProduct = await tx.product.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                price: Number(data.price),
                sku: data.sku,
                barcode: data.barcode,
                color: data.color,
                images: finalImages,
                newArrival: Boolean(data.newArrival)
            }
        });

        // 5️⃣ Description update
        if (data.description) {
            const desc = await tx.productDescription.findUnique({
                where: { productId: id }
            });

            if (desc) {
                await tx.productDescription.update({
                    where: { productId: id },
                    data: {
                        intro: data.description.intro,
                        bulletPoints: data.description.bulletPoints || [],
                        outro: data.description.outro,
                    }
                });
            } else {
                await tx.productDescription.create({
                    data: {
                        productId: id,
                        intro: data.description.intro,
                        bulletPoints: data.description.bulletPoints || [],
                        outro: data.description.outro,
                    }
                });
            }
        }

        // 6️⃣ Update categories
        if (data.categories) {
            await tx.productCategory.deleteMany({ where: { productId: id } });
            for (const catId of data.categories) {
                await tx.productCategory.create({
                    data: { productId: id, categoryId: catId }
                });
            }
        }

        // 7️⃣ Update variant options
        if (data.variantOptions) {
            await tx.variantOption.deleteMany({ where: { productId: id } });
            for (const v of data.variantOptions) {
                await tx.variantOption.create({
                    data: {
                        productId: id,
                        size: v.size,
                        stock: v.stock
                    }
                });
            }
        }

        return updatedProduct;
    });
};



const deleteProduct = async (id: string) => {

    return await prisma.$transaction(async (tx) => {
        // Find product
        const product = await tx.product.findUnique({
            where: { id },
            include: {
                productCategory: true,
                variantOption: true,
                description: true
            }
        });

        if (!product) throw new ApiError(404, "Product not found");


        // Delete description
        if (product.description) {
            await tx.productDescription.delete({
                where: { productId: id }
            });
        }

        // Delete variant options
        await tx.variantOption.deleteMany({
            where: { productId: id }
        });

        // Remove category relations
        await tx.productCategory.deleteMany({
            where: { productId: id }
        });

        // Delete the product
        const deletedProduct = await tx.product.delete({
            where: { id }
        });

        return deletedProduct;
    });
};


export const ProductService = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductBySlug
}  
