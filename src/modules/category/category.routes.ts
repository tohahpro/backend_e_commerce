import express from 'express';
import { CategoryController } from './category.controller';

const router = express.Router();

router.post("/", CategoryController.createCategory)


export const CategoryRoutes = router;