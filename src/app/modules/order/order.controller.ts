import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { OrderService } from "./order.service";
import { pick } from "../../helper/pick";

const createOrder = catchAsync(async (req, res) => {
    const session = req.cookies;

    const result = await OrderService.createOrder(session, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Order created successfully",
        data: result,
    });
});

const getAllOrders = catchAsync(async (req, res) => {
    const filters = pick(req.query, ["searchValue"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await OrderService.getAllOrders(filters, options);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
});

const updateOrder = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await OrderService.updatedOrder(id, status);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Order updated successfully",
        data: result,
    });
})

const deleteOrder = catchAsync(async (req, res) => {
    const { id } = req.params;

    const result = await OrderService.deleteOrder(id);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Order deleted successfully",
        data: result,
    });
})

export const OrderController = {
    createOrder,
    getAllOrders,
    updateOrder,
    deleteOrder,
};
