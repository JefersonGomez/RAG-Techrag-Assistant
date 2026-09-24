-- CreateTable
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "embedding" DOUBLE PRECISION[],

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);
