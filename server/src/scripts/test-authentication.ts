import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import { authenticateMember } from "../services/auth-service.js";

async function main(): Promise<void> {
  const temporaryPassword =
    process.env["SEED_MANAGER_TEMP_PASSWORD"];

  if (!temporaryPassword) {
    throw new Error(
      "SEED_MANAGER_TEMP_PASSWORD is missing",
    );
  }

  const correctResult = await authenticateMember(
    "001",
    temporaryPassword,
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