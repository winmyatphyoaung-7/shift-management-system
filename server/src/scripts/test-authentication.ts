import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import { authenticateMember } from "../services/auth-service.js";

async function main(): Promise<void> {
  const currentPassword =
  process.env["CURRENT_MANAGER_PASSWORD"];

  if (!currentPassword) {
  throw new Error(
    "CURRENT_MANAGER_PASSWORD is missing",
  );
}

  const correctResult = await authenticateMember(
    "001",
    currentPassword,
  );

  const wrongResult = await authenticateMember(
    "001",
    "definitely-wrong-password",
  );

  console.log({
    correctPasswordAccepted: correctResult !== null,
    wrongPasswordRejected: wrongResult === null,
    authenticatedMember: correctResult,
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });