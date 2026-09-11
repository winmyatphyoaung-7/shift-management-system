import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import { findActiveMembershipByLoginId } from "../services/auth-service.js";

async function main(): Promise<void> {
  const membership =
    await findActiveMembershipByLoginId("001");

    // console.log(membership);

  if (!membership) {
    console.log({
      found: false,
      message: "Active membership not found",
    });
    return;
  }

  console.log({
    found: true,
    membership: {
      id: membership.id,
      storeId: membership.storeId,
      loginId: membership.loginId,
      role: membership.role,
      user: {
        id: membership.user.id,
        name: membership.user.name,
        mustChangePassword:
          membership.user.mustChangePassword,
      },
    },
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