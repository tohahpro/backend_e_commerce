import express, { NextFunction, Request, Response } from "express";
import { UserValidation } from "./user.validation";
import { UserController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/register",
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidation.createUserSchema.parse(req.body);
    return UserController.registerUser(req, res, next);
  }
);
router.patch("/update-profile", auth(UserRole.ADMIN, UserRole.CUSTOMER), UserController.updateProfile);

export const UserRoutes = router;
