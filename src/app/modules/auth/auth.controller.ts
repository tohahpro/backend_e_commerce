import { Request, Response } from "express"
import catchAsync from "../../shared/catchAsync"
import sendResponse from "../../shared/sendResponse"
import httpStatus from 'http-status'
import { AuthService } from "./auth.service"



const login = catchAsync(async (req: Request, res: Response)=>{
    
    const result = await AuthService.login(req.body)
    const {accessToken, refreshToken} = result

    res.cookie("accessToken", accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none"
    })
    res.cookie("refreshToken", refreshToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 80
    })

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "User Login successfully",
        data: result
    })
})

const logout = catchAsync(async (req: Request, res: Response)=>{
    
    res.clearCookie("accessToken",{
        httpOnly: true,
        secure: true,
        sameSite: "none"
    })

    res.clearCookie("refreshToken",{
        httpOnly: true,
        secure: true,
        sameSite: "none"
    })

    sendResponse(res,{
        success: true,
        statusCode: httpStatus.OK,
        message: 'User logged out successfully',
        data : null
    })
})

const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    const result = await AuthService.refreshToken(refreshToken);
    res.cookie("accessToken", result.accessToken, {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 *24 *30,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Access token generated successfully!",
        data: {
            message: "Access token generated successfully!",
        },
    });
});

const changePassword = catchAsync(
    async (req: Request & { user?: any }, res: Response) => {
        const user = req.user;

        const result = await AuthService.changePassword(user, req.body);

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Password Changed successfully",
            data: result,
        });
    }
);

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    await AuthService.forgotPassword(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Check your email!",
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const token = req.headers.authorization || "";

    await AuthService.resetPassword(token, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Password Reset!",
        data: null,
    });
});

export const AuthController = {
    login,
    logout,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
}