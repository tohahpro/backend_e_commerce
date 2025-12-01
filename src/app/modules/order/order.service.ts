import { PrismaClient } from "@prisma/client";
import { Secret } from "jsonwebtoken";
import { jwtHelper } from "../../helper/jwtHelper";
import config from "../../config";


const prisma = new PrismaClient();


const createOrder = async (session: any, payload: any) => {
    let userId: string | null = null;
    let wishlistItems: any[] = [];
    let orderItemsData: any[] = [];

    // CHECK LOGGED USER
    try {
        const accessToken = session?.accessToken;
        if (accessToken) {
            const decoded: any = jwtHelper.verifyToken(
                accessToken,
                config.JWT.JWT_ACCESS_SECRET as Secret
            );

            const user = await prisma.user.findUnique({
                where: { email: decoded.email },
                select: { id: true },
            });

            if (user) userId = user.id;
        }
    } catch { }

    // LOGGED-IN USER → USE WISHLIST
    if (userId) {
        wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId },
            include: { product: true },
        });

        if (wishlistItems.length === 0) {
            throw new Error("Your wishlist is empty!");
        }

        // Convert wishlist items → orderItems
        orderItemsData = wishlistItems.map((item) => ({
            productId: item.productId,
            title: item.product.title,
            price: item.product.price,
            quantity: item.quantity,        
            size: item.size || null,
            color: item.color || null,
            image: item.product.images?.[0] || null,
        }));
    }

    // GUEST USER → USE CART ITEMS
    else {
        if (!payload.cartItems || payload.cartItems.length === 0) {
            throw new Error("Guest user must provide cartItems!");
        }

        for (const item of payload.cartItems) {
            const product = await prisma.product.findUniqueOrThrow({
                where: { id: item.productId },
            });

            orderItemsData.push({
                productId: product.id,
                title: product.title,
                price: product.price,
                quantity: item.quantity || 1,
                size: item.size || null,
                color: item.color || null,
                image: product.images?.[0] || null,
            });
        }
    }


    // CALCULATE TOTAL AMOUNT
    const totalAmount = orderItemsData.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    // CREATE ORDER USING TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
            data: {
                userId: userId,
                totalAmount,
                status: "PENDING",
            },
        });

        // Insert each order item
        for (const item of orderItemsData) {
            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    productId: item.productId,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color,
                    image: item.image,
                },
            });
        }

        // Shipping info
        const s = payload.shippingInfo;
        await tx.shippingInfo.create({
            data: {
                orderId: order.id,
                name: s.name,
                phone: s.phone,
                address: s.address,
                city: s.city,
                postalCode: s.postalCode,
                country: s.country || "Bangladesh",
            },
        });

        // Clear wishlist ONLY for logged user
        if (userId) {
            await tx.wishlistItem.deleteMany({
                where: { userId },
            });
        }

        return order;
    });

    //  FINAL ORDER DETAILS
    return await prisma.order.findUnique({
        where: { id: result.id },
        include: {
            orderItems: true,
            shippingInfo: true,
        },
    });
};


export const OrderService = {
    createOrder,
};
