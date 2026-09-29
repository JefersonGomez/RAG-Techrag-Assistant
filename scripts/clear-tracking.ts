// scripts/clear-tracking.ts
import { prisma } from '../src/db';

async function main() {
  const result = await prisma.repoIngestion.deleteMany();
  console.log(`✅ Tracking borrado: ${result.count} filas eliminadas`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());