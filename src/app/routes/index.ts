import express from 'express';
import { CategoryRoutes } from '../modules/category/category.routes';
import { ProductRoutes } from '../modules/product/product.routes';
import { UserRoutes } from '../modules/user/user.routes';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/category',
        route: CategoryRoutes
    },   
    {
        path: '/product',
        route: ProductRoutes
    },   
    {
        path: '/users',
        route: UserRoutes
    },

];

moduleRoutes.forEach(route => router.use(route.path, route.route))


export default router;