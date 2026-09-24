/*
  Warnings:

  - Changed the type of `embedding` on the `document_chunks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "document_chunks" DROP COLUMN "embedding",
ADD COLUMN     "embedding" vector(1024) NOT NULL;
