/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId,size]` on the table `wishlist_items` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `wishlist_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "wishlist_items_userId_productId_key";

-- AlterTable
ALTER TABLE "wishlist_items" ADD COLUMN     "color" TEXT,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_productId_size_key" ON "wishlist_items"("userId", "productId", "size");
