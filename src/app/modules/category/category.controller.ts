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

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.getAllCategories();

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All categories fetched successfully!",
        data: result
    })
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CategoryService.getSingleCategory(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Category fetched successfully!",
        data: result
    })
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CategoryService.deleteCategory(id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Category deleted successfully!",
        data: result
    })
});


export const CategoryController = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    deleteCategory
}