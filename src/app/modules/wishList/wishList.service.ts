
import { PrismaClient } from "@prisma/client";
import { Secret } from "jsonwebtoken";
import { jwtHelper } from "../../helper/jwtHelper";
import config from "../../config";


const prisma = new PrismaClient();

const addToWishlist = async (session: any, payload: { productId: string }) => {
    const accessToken = session?.accessToken;
    if (!accessToken) {
        throw new Error("Unauthorized request");
    }

    const decodedData: any = jwtHelper.verifyToken(
        accessToken,
        config.JWT.JWT_ACCESS_SECRET as Secret
    );

    // Get user
    const user = await prisma.user.findUniqueOrThrow({
        where: { email: decodedData.email },
        select: { id: true }
    });

    const { productId } = payload;

    // Check product exist
    const product = await prisma.product.findUniqueOrThrow({
        where: { id: productId },
        select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            sku: true,
            barcode: true,
            images: true,  
            color: true,
            createdAt: true,
            updatedAt: true
        }
    });

    
    const existing = await prisma.wishlistItem.findUnique({
        where: {
            userId_productId: {
                userId: user.id,
                productId: productId,
            },
        },
    });

    if (existing) {
        throw new Error("Product already in wishlist");
    }

    // Add to wishlist
    const wishItem = await prisma.wishlistItem.create({
        data: {
            userId: user.id,
            productId,
        },
        include: {
            product: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    price: true,
                    sku: true,
                    barcode: true,
                    images: true, 
                    color: true,
                    createdAt: true,
                    updatedAt: true
                }
            }
        },
    });

    return wishItem;
};

const getUserWishlist = async (session: any) => {
    const accessToken = session?.accessToken;
    if (!accessToken) throw new Error("Unauthorized request");

    const decodedData: any = jwtHelper.verifyToken(
        accessToken,
        config.JWT.JWT_ACCESS_SECRET as Secret
    );

    // Get user
    const user = await prisma.user.findUniqueOrThrow({
        where: { email: decodedData.email },
        select: { id: true },
    });

    // Fetch wishlist items with product info
    const wishlistItems = await prisma.wishlistItem.findMany({
        where: { userId: user.id },
        include: {
            product: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    price: true,
                    sku: true,
                    barcode: true,
                    images: true, 
                    color: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return wishlistItems;
};

const deleteFromWishlist = async (session: any, wishlistItemId: string) => {
    const accessToken = session?.accessToken;
    if (!accessToken) throw new Error("Unauthorized request");

    const decodedData: any = jwtHelper.verifyToken(
        accessToken,
        config.JWT.JWT_ACCESS_SECRET as Secret
    );

    // Get user
    const user = await prisma.user.findUniqueOrThrow({
        where: { email: decodedData.email },
        select: { id: true },
    });

    // Delete wishlist item by its ID and userId for security
    const deletedItem = await prisma.wishlistItem.deleteMany({
        where: {
            id: wishlistItemId,
            userId: user.id,
        },
    });

    if (deletedItem.count === 0) {
        throw new Error("Wishlist item not found or unauthorized");
    }

    return { id: wishlistItemId };
};

export const WishlistService = {
    addToWishlist,
    getUserWishlist,
    deleteFromWishlist,
};
