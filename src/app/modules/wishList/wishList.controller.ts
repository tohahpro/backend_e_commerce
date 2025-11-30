import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { WishlistService } from "./wishList.service";

const addToWishlist = catchAsync(async (req, res) => {
    const session = req.cookies; 
    const result = await WishlistService.addToWishlist(session, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Product added to wishlist successfully",
        data: result,
    });
});

const getUserWishlist = catchAsync(async (req, res) => {
    const session = req.cookies; 
    const result = await WishlistService.getUserWishlist(session);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User wishlist retrieved successfully",
        data: result,
    });
});

const deleteFromWishlist = catchAsync(async (req, res) => {
    const session = req.cookies;
    const { id } = req.params;

    const result = await WishlistService.deleteFromWishlist(session, id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product removed from wishlist",
        data: result,
    });
});

export const WishlistController = {
    addToWishlist,
    getUserWishlist,
    deleteFromWishlist
};
