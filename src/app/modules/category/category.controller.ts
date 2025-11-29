import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CategoryService } from "./category.service";


const createCategory = catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const result = await CategoryService.createCategory(payload);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Category created successfully!",
        data: result
    })
});



export const CategoryController = {
    createCategory,

}