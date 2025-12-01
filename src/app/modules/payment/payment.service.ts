import { PrismaClient, OrderStatus, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";


const prisma = new PrismaClient();

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
    switch (event.type) {        
        case "checkout.session.completed": {
            const session = event.data.object as any;

            const orderId = session.metadata?.orderId;
            const paymentIntentId = session.payment_intent;

            if (!orderId) {
                console.error("❌ Missing orderId in Stripe metadata");
                return;
            }

            const order = await prisma.order.findUnique({
                where: { id: orderId },
            });

            if (!order) {
                console.error("❌ Order not found:", orderId);
                return;
            }

             // Update order status
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.CONFIRMED,
                },
            });

            // Update payment info
            await prisma.paymentInfo.update({
                where: { orderId },
                data: {
                    method: "STRIPE",
                    txnId: paymentIntentId,
                    status: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.UNPAID,
                    paymentGatewayData: session
                },
            });

            break;
        }

        // PAYMENT FAILED
        case "payment_intent.payment_failed": {
            const intent = event.data.object as any;

            const orderId = intent.metadata?.orderId;

            if (!orderId) return;

            console.log("❌ Payment Failed → Updating Order & Payment");

            // Update payment info
            await prisma.paymentInfo.update({
                where: { orderId },
                data: {
                    status: PaymentStatus.UNPAID,
                    txnId: intent.id,
                },
            });

            // Update order status
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: OrderStatus.PENDING, 
                },
            });

            break;
        }
        
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
};

export const PaymentService = {
    handleStripeWebhookEvent,
};
