import { Secret } from "jsonwebtoken";
import config from "../../config";
import { stripe } from "../../helper/stripe";
import { jwtHelper } from "../../helper/jwtHelper";
import { OrderStatus, PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';


const prisma = new PrismaClient();


export const createOrder = async (session: any, payload: any) => {
    let userId: string | null = null;
    let wishlistItems: any[] = [];
    let orderItemsData: any[] = [];
    
    // 1. CHECK AUTH USER    
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
    } catch {}

    
    // 2. LOGGED USER → WISHLIST ITEMS
    
    if (userId) {
        wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId },
            include: { product: true },
        });

        if (wishlistItems.length === 0) {
            throw new Error("Your wishlist is empty!");
        }

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

    
    // 3. GUEST USER → CART ITEMS
    
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
    
    // 4. CALCULATE TOTAL AMOUNT    
    const totalAmount = orderItemsData.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    
    // 5. CREATE ORDER + PAYMENT_INFO + SESSION
    
    const result = await prisma.$transaction(async (tx) => {
        // Create order
        const order = await tx.order.create({
            data: {
                userId: userId,
                totalAmount,
                status: "PENDING",
            },
        });

        // Order items
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

        const transactionId = uuidv4();
        // Create PaymentInfo row
        const paymentInfo = await tx.paymentInfo.create({
            data: {
                orderId: order.id,
                method: "STRIPE",
                status: OrderStatus.PENDING,
                txnId: transactionId
            },
        });

        // Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: orderItemsData.map((item) => ({
                price_data: {
                    currency: "bdt",
                    product_data: {
                        name: item.title,
                    },
                    unit_amount: item.price * 100,
                },
                quantity: item.quantity,
            })),

            metadata: {
                orderId: order.id,
                paymentId: paymentInfo.id,
            },

            success_url: config.successUrl as string,
            cancel_url: config.cancelUrl as string,
        });

        // Clear wishlist for logged user
        if (userId) {
            await tx.wishlistItem.deleteMany({
                where: { userId },
            });
        }
console.log(session);
        return { order, paymentUrl: session.url };
    });

    return result;
};


export const OrderService = {
    createOrder,
};
