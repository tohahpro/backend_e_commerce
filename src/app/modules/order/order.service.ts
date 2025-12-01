import  httpStatus  from 'http-status';
import { Secret } from "jsonwebtoken";
import config from "../../config";
import { stripe } from "../../helper/stripe";
import { jwtHelper } from "../../helper/jwtHelper";
import { OrderStatus, PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';
import ApiError from "../../errors/ApiError";
import { paginationHelper } from '../../helper/paginationHelper';


const prisma = new PrismaClient();


// export const createOrder = async (session: any, payload: any) => {
//     let userId: string | null = null;
//     let orderItemsData: any[] = [];



//     if (!payload.cartItems || payload.cartItems.length === 0) {
//         throw new Error("Guest user must provide cartItems!");
//     }

//     for (const item of payload.cartItems) {
//         const product = await prisma.product.findUniqueOrThrow({
//             where: { id: item.productId },
//         });

//         orderItemsData.push({
//             productId: product.id,
//             title: product.title,
//             price: product.price,
//             quantity: item.quantity || 1,
//             size: item.size || null,
//             color: item.color || null,
//             image: product.images?.[0] || null,
//         });
//     }


//     // 4. CALCULATE TOTAL AMOUNT    
//     const totalAmount = orderItemsData.reduce(
//         (sum, item) => sum + item.price * item.quantity,
//         0
//     );


//     // 5. CREATE ORDER + PAYMENT_INFO + SESSION

//     const result = await prisma.$transaction(async (tx) => {
//         // Create order
//         const order = await tx.order.create({
//             data: {
//                 userId: userId,
//                 totalAmount,
//                 status: "PENDING",
//             },
//         });

//         // Order items
//         for (const item of orderItemsData) {
//             await tx.orderItem.create({
//                 data: {
//                     orderId: order.id,
//                     productId: item.productId,
//                     title: item.title,
//                     price: item.price,
//                     quantity: item.quantity,
//                     size: item.size,
//                     color: item.color,
//                     image: item.image,
//                 },
//             });
//         }

//         // Shipping info
//         const s = payload.shippingInfo;
//         await tx.shippingInfo.create({
//             data: {
//                 orderId: order.id,
//                 name: s.name,
//                 phone: s.phone,
//                 address: s.address,
//                 city: s.city,
//                 postalCode: s.postalCode,
//                 country: s.country || "Bangladesh",
//             },
//         });

//         const transactionId = uuidv4();
//         // Create PaymentInfo row
//         const paymentInfo = await tx.paymentInfo.create({
//             data: {
//                 orderId: order.id,
//                 method: "STRIPE",
//                 status: OrderStatus.PENDING,
//                 txnId: transactionId
//             },
//         });

//         // Create Stripe Session
//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ["card"],
//             mode: "payment",
//             line_items: orderItemsData.map((item) => ({
//                 price_data: {
//                     currency: "bdt",
//                     product_data: {
//                         name: item.title,
//                     },
//                     unit_amount: item.price * 100,
//                 },
//                 quantity: item.quantity,
//             })),

//             metadata: {
//                 orderId: order.id,
//                 paymentId: paymentInfo.id,
//             },

//             success_url: config.successUrl as string,
//             cancel_url: config.cancelUrl as string,
//         });

//         // Clear wishlist for logged user
//         if (userId) {
//             await tx.wishlistItem.deleteMany({
//                 where: { userId },
//             });
//         }
//         return { order, paymentUrl: session.url };
//     });

//     return result;
// };


export const createOrder = async (session: any, payload: any) => {
    let userId: string | null = null;

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
    } catch (e) {
        console.log("User not logged in → Guest checkout");
    }


    // 2. CART ITEMS MUST COME FROM PAYLOAD
    if (!payload.cartItems || payload.cartItems.length === 0) {
        throw new Error("Cart items are required!");
    }

    const orderItemsData: any[] = [];

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
            color: product.color || null,
            image: product.images?.[0] || null,
        });
    }


    // 3. CALCULATE TOTAL AMOUNT
    const totalAmount = orderItemsData.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );


    // 4. CREATE ORDER + ITEMS + SHIPPING + PAYMENT_INFO + STRIPE SESSION
    const result = await prisma.$transaction(async (tx) => {
        // ORDER
        const order = await tx.order.create({
            data: {
                userId: userId,        // Logged in → userId | Guest → null
                totalAmount,
                status: "PENDING",
            },
        });

        // ORDER ITEMS
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

        // SHIPPING INFO
        const s = payload.shippingInfo;
        const shippingInfo = await tx.shippingInfo.create({
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

        // PAYMENT INFO
        const transactionId = uuidv4();
        const paymentInfo = await tx.paymentInfo.create({
            data: {
                orderId: order.id,
                method: "STRIPE",
                status: OrderStatus.PENDING,
                txnId: transactionId,
            },
        });

        // STRIPE CHECKOUT SESSION
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: orderItemsData.map((item) => ({
                price_data: {
                    currency: "bdt",
                    product_data: { name: item.title },
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

        return {
            order,
            shippingInfo,
            items: orderItemsData,
            paymentUrl: stripeSession.url,
        };
    });

    return result;
};

const getAllOrders = async (filters: any, options: any) => {
  const { searchValue } = filters;

  // Pagination calculation
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const andConditions: any[] = [];

  // Search
  if (searchValue) {
    andConditions.push({
      OR: [
        { status: { contains: searchValue, mode: "insensitive" } },
        { shippingInfo: { name: { contains: searchValue, mode: "insensitive" } } },
        { shippingInfo: { phone: { contains: searchValue, mode: "insensitive" } } },
      ],
    });
  }

  const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.order.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      orderItems: true,
      shippingInfo: true,
      paymentInfo: true,
    },
  });

  const total = await prisma.order.count({
    where: whereCondition,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const updatedOrder = async (orderId: string, status: string)=>{
    
    if(!Object.values(OrderStatus).includes(status as OrderStatus)){
        throw new ApiError(httpStatus.BAD_REQUEST, "Status is not exist!");        
    }

    if(status === OrderStatus.PENDING){
        throw new ApiError(httpStatus.BAD_REQUEST, "Pending Status is not set!");        
    }

    return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if(!order){
        throw new ApiError(httpStatus.NOT_FOUND, "Order ID is not exist!");
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: status as OrderStatus,
      },
    });

    return updatedOrder;
  });

}

const deleteOrder = async (orderId: string) => {
  
    if(!orderId){
        throw new Error("Order ID is not exist!");
    }
  
    return await prisma.$transaction(async (tx) => {
    // Check exist
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        shippingInfo: true,
        paymentInfo: true,
      },
    });

    if (!order) {
      throw new Error("Order not found!");
    }

    // Delete relations first
    await tx.orderItem.deleteMany({
      where: { orderId },
    });

    await tx.shippingInfo.deleteMany({
      where: { orderId },
    });

    await tx.paymentInfo.deleteMany({
      where: { orderId },
    });

    // Delete main order
    const deletedOrder = await tx.order.delete({
      where: { id: orderId },
    });

    return deletedOrder;
  });
};

export const OrderService = {
    createOrder,
    getAllOrders,
    updatedOrder,
    deleteOrder,
};
