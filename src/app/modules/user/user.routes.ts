import express, { NextFunction, Request, Response } from "express";
import { UserValidation } from "./user.validation";
import { UserController } from "./user.controller";

const router = express.Router();

router.post(
  "/register",
  (req: Request, res: Response, next: NextFunction) => {
    req.body = UserValidation.createUserSchema.parse(req.body);
    return UserController.registerUser(req, res, next);
  }
);

export const UserRoutes = router;
