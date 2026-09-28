-- CreateTable
CREATE TABLE "RepoIngestion" (
    "id" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "lastCommit" TEXT NOT NULL,
    "chunksCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepoIngestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RepoIngestion_repoUrl_key" ON "RepoIngestion"("repoUrl");

-- CreateIndex
CREATE INDEX "RepoIngestion_repoUrl_idx" ON "RepoIngestion"("repoUrl");
