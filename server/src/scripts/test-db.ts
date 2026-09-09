import { prisma } from "../lib/prisma.js";

async function main(): Promise<void> {
  const storeCount = await prisma.store.count();
  const userCount = await prisma.user.count();
  const memberCount = await prisma.storeMember.count();
  const presetCount = await prisma.shiftPreset.count();

  console.log({
    storeCount,
    userCount,
    memberCount,
    presetCount,
  });
}

main()
  .catch((error: unknown) => {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown database error");
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });