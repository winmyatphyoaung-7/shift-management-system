/// <reference types="node" />

import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  MemberStatus,
  Role,
} from "../src/generated/prisma/enums.js";

const databaseUrl = process.env["DATABASE_URL"];
const managerTemporaryPassword =
  process.env["SEED_MANAGER_TEMP_PASSWORD"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

if (
  !managerTemporaryPassword ||
  managerTemporaryPassword.length < 12
) {
  throw new Error(
    "SEED_MANAGER_TEMP_PASSWORD must contain at least 12 characters",
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const shiftPresets = [
  {
    name: "Morning",
    startMinute: 8 * 60,
    endMinute: 13 * 60,
    crossesMidnight: false,
    sortOrder: 1,
  },
  {
    name: "Afternoon",
    startMinute: 13 * 60,
    endMinute: 17 * 60,
    crossesMidnight: false,
    sortOrder: 2,
  },
  {
    name: "Evening",
    startMinute: 17 * 60,
    endMinute: 22 * 60,
    crossesMidnight: false,
    sortOrder: 3,
  },
  {
    name: "Night",
    startMinute: 22 * 60,
    endMinute: 8 * 60,
    crossesMidnight: true,
    sortOrder: 4,
  },
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(
    managerTemporaryPassword,
    12,
  );

  const result = await prisma.$transaction(async (tx) => {
    const store = await tx.store.upsert({
      where: {
        code: "STORE001",
      },
      update: {
        name: "Demo Convenience Store",
        timeZone: "Asia/Tokyo",
      },
      create: {
        code: "STORE001",
        name: "Demo Convenience Store",
        timeZone: "Asia/Tokyo",
      },
    });

    const existingManager =
      await tx.storeMember.findUnique({
        where: {
          storeId_loginId: {
            storeId: store.id,
            loginId: "001",
          },
        },
      });

    let managerCreated = false;

    if (!existingManager) {
      const managerUser = await tx.user.create({
        data: {
          name: "Demo Manager",
          passwordHash,
          mustChangePassword: true,
        },
      });

      await tx.storeMember.create({
        data: {
          storeId: store.id,
          userId: managerUser.id,
          loginId: "001",
          role: Role.MANAGER,
          status: MemberStatus.ACTIVE,
          colorKey: "blue",
        },
      });

      managerCreated = true;
    }

    for (const preset of shiftPresets) {
      await tx.shiftPreset.upsert({
        where: {
          storeId_name: {
            storeId: store.id,
            name: preset.name,
          },
        },
        update: {
          startMinute: preset.startMinute,
          endMinute: preset.endMinute,
          crossesMidnight: preset.crossesMidnight,
          defaultRequiredCount: 2,
          sortOrder: preset.sortOrder,
          isActive: true,
        },
        create: {
          storeId: store.id,
          name: preset.name,
          startMinute: preset.startMinute,
          endMinute: preset.endMinute,
          crossesMidnight: preset.crossesMidnight,
          defaultRequiredCount: 2,
          sortOrder: preset.sortOrder,
          isActive: true,
        },
      });
    }

    return {
      storeCode: store.code,
      managerCreated,
      presetCount: shiftPresets.length,
    };
  });

  console.log("Seed completed:", result);
}

main()
  .catch((error: unknown) => {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error("Unknown seed error");
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });