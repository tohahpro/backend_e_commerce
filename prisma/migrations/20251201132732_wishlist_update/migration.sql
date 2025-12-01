/*
  Warnings:

  - You are about to drop the column `color` on the `wishlist_items` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `wishlist_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,productId]` on the table `wishlist_items` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "wishlist_items_userId_productId_size_key";

-- AlterTable
ALTER TABLE "wishlist_items" DROP COLUMN "color",
DROP COLUMN "size";

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_productId_key" ON "wishlist_items"("userId", "productId");
