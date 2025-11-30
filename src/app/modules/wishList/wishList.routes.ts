import express from "express";
import { WishlistController } from "./wishList.controller";

const router = express.Router();

// Must be logged in
router.post("/add-product", WishlistController.addToWishlist);
router.get("/my-wishlist", WishlistController.getUserWishlist);
router.delete("/delete/:id", WishlistController.deleteFromWishlist);


export const WishlistRoutes = router;
