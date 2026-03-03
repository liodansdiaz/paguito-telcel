/*
  Warnings:

  - You are about to drop the column `imagenUrl` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "imagenUrl",
ADD COLUMN     "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[];
