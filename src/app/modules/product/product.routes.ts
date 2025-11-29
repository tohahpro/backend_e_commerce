import express, { NextFunction, Request, Response } from 'express'
import { fileUploader } from '../../helper/fileUploader';
import { ProductValidation } from './product.validation';
import { ProductController } from './product.controller';



const router = express.Router();

router.post(
    "/create-product",
    fileUploader.upload.array("files", 10), // ⬅️ multiple images
    (req: Request, res: Response, next: NextFunction) => {
        req.body = ProductValidation.createProductSchema.parse(
            JSON.parse(req.body.data)
        );
        return ProductController.createProduct(req, res, next);
    }
);

router.patch(
  "/:id",
  fileUploader.upload.array("files"), // multiple images
  (req: Request, res: Response, next: NextFunction) => {
    req.body = ProductValidation.updateProductSchema.parse(JSON.parse(req.body.data));
    return ProductController.updateProduct(req, res, next);
  }
);

router.get("/", ProductController.getAllProducts);
router.get("/:id", ProductController.getProductById);

router.delete("/:id", ProductController.deleteProduct);


export const ProductRoutes = router;