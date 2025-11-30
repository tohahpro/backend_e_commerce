import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.serivce";



const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.registerUser(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const userSession = req.cookies;
  const result = await UserService.updateProfile(userSession, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

export const UserController = {
  registerUser,
  updateProfile
};
