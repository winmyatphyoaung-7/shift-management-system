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
        note: {
          contains: "API test",
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
        scheduleDayId: true,
        startAt: true,
        note: true,
      },
    });

  if (!targetShift) {
    throw new Error(
      "Future draft test shift was not found",
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

  const deleteResponse = await fetch(
    `${baseUrl}/shifts/${targetShift.id}`,
    {
      method: "DELETE",
      headers: {
        Cookie: authCookie,
      },
    },
  );

  const deleteBody =
    await deleteResponse.json();

  const secondDeleteResponse =
    await fetch(
      `${baseUrl}/shifts/${targetShift.id}`,
      {
        method: "DELETE",
        headers: {
          Cookie: authCookie,
        },
      },
    );

  const secondDeleteBody =
    await secondDeleteResponse.json();

  const storedShift =
    await prisma.shift.findUnique({
      where: {
        id: targetShift.id,
      },
      select: {
        id: true,
      },
    });

  const storedScheduleDay =
    await prisma.scheduleDay.findUnique({
      where: {
        id: targetShift.scheduleDayId,
      },
      select: {
        id: true,

        _count: {
          select: {
            shifts: true,
            coverageRequirements: true,
          },
        },
      },
    });

  console.log(
    JSON.stringify(
      {
        loginStatusCode:
          loginResponse.status,

        deletedShift: {
          id: targetShift.id,
          startAt:
            targetShift.startAt.toISOString(),
          note: targetShift.note,
        },

        deleteStatusCode:
          deleteResponse.status,
        deleteBody,

        secondDeleteStatusCode:
          secondDeleteResponse.status,
        secondDeleteBody,

        shiftStillExists:
          storedShift !== null,

        scheduleDayStillExists:
          storedScheduleDay !== null,

        remainingCounts:
          storedScheduleDay?._count ??
          null,
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