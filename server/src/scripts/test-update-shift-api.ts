import "dotenv/config";

import { prisma } from "../lib/prisma.js";

const baseUrl =
  "http://localhost:3000/api/v1";

const currentManagerPassword =
  process.env["CURRENT_MANAGER_PASSWORD"];

if (!currentManagerPassword) {
  throw new Error(
    "CURRENT_MANAGER_PASSWORD is required",
  );
}

async function main(): Promise<void> {
  const manager =
    await prisma.storeMember.findFirst({
      where: {
        loginId: "001",
        role: "MANAGER",
        status: "ACTIVE",
      },
      select: {
        storeId: true,
      },
    });

  if (!manager) {
    throw new Error(
      "Active manager was not found",
    );
  }

  const targetShift =
    await prisma.shift.findFirst({
      where: {
        status: "ACTIVE",
        startAt: {
          gt: new Date(),
        },
        scheduleDay: {
          storeId: manager.storeId,
          status: "DRAFT",
        },
      },
      orderBy: {
        startAt: "desc",
      },
      select: {
        id: true,
        assigneeMembershipId: true,
        shiftPresetId: true,
        startAt: true,
        endAt: true,
        breakMinutes: true,
        note: true,
      },
    });

  if (!targetShift) {
    throw new Error(
      "Future draft shift was not found",
    );
  }

  const loginResponse = await fetch(
    `${baseUrl}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        loginId: "001",
        password:
          currentManagerPassword,
      }),
    },
  );

  const authCookie =
    loginResponse.headers
      .get("set-cookie")
      ?.split(";")[0];

  if (!authCookie) {
    throw new Error(
      "Authentication cookie was not received",
    );
  }

  const updateResponse = await fetch(
    `${baseUrl}/shifts/${targetShift.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({
        note:
          "Draft shift updated by API test",
      }),
    },
  );

  const updateBody =
    await updateResponse.json();

  const emptyBodyResponse = await fetch(
    `${baseUrl}/shifts/${targetShift.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
        Cookie: authCookie,
      },
      body: JSON.stringify({}),
    },
  );

  const emptyBody =
    await emptyBodyResponse.json();

  console.log(
    JSON.stringify(
      {
        loginStatusCode:
          loginResponse.status,

        beforeUpdate: {
          ...targetShift,
          startAt:
            targetShift.startAt.toISOString(),
          endAt:
            targetShift.endAt.toISOString(),
        },

        updateStatusCode:
          updateResponse.status,
        updateBody,

        emptyBodyStatusCode:
          emptyBodyResponse.status,
        emptyBody,
      },
      null,
      2,
    ),
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}