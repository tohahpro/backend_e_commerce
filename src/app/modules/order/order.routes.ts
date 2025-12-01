import express from "express";
import { OrderController } from "./order.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();

router.post("/create", OrderController.createOrder);
router.get("/", auth(UserRole.ADMIN),OrderController.getAllOrders);
router.delete("/delete/:id",auth(UserRole.ADMIN), OrderController.deleteOrder);
router.patch("/status/:id", auth(UserRole.ADMIN), OrderController.updateOrder);

export const OrderRoutes = router;
