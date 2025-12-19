import { Request, Response } from "express"
import catchAsync from "../../shared/catchAsync"
import sendResponse from "../../shared/sendResponse"
import { ProductService } from "./product.service"
import { pick } from "../../helper/pick"


const createProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductService.createProduct(req)

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Product created successfully",
        data: result
    })
})


const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchValue"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await ProductService.getAllProducts(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Products retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getProductBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const result = await ProductService.getProductBySlug(slug);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product retrieved successfully by slug",
    data: result,
  });
});


const getProductById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ProductService.getProductById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product retrieved successfully",
    data: result,
  });
});


const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ProductService.updateProduct(id, req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product updated successfully",
    data: result
  });
});


const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ProductService.deleteProduct(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Product deleted successfully",
    data: result,
  });
});


export const ProductController = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductBySlug
}