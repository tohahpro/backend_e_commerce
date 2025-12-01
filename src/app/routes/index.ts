import express from 'express';
import { CategoryRoutes } from '../modules/category/category.routes';
import { ProductRoutes } from '../modules/product/product.routes';
import { UserRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { WishlistRoutes } from '../modules/wishList/wishList.routes';
import { OrderRoutes } from '../modules/order/order.routes';

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
    {
        path: '/auths',
        route: AuthRoutes
    },
    {
        path: '/wishlist',
        route: WishlistRoutes
    },
    {
        path: '/orders',
        route: OrderRoutes
    },

];

moduleRoutes.forEach(route => router.use(route.path, route.route))


export default router;