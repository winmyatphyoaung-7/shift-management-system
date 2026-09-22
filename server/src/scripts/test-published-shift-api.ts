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

type ApiResponseBody = {
  status?: string;
  code?: string;
  message?: string;
  data?: {
    shift?: {
      id: string;
      status: string;
      note: string | null;
    };
    warnings?: unknown[];
  };
};

type ScheduleResponseBody = {
  data?: {
    scheduleDays?: Array<{
      shifts: Array<{
        id: string;
        status: string;
        cancelledAt: string | null;
      }>;
    }>;
  };
};

const targetShift =
  await prisma.shift.findFirst({
    where: {
      status: "ACTIVE",
      startAt: {
        gt: new Date(),
      },
      scheduleDay: {
        status: "PUBLISHED",
      },
    },
    orderBy: {
      startAt: "asc",
    },
    select: {
      id: true,
      note: true,
      scheduleDay: {
        select: {
          scheduleDate: true,
        },
      },
    },
  });

if (!targetShift) {
  throw new Error(
    "A future active published shift is required",
  );
}

const scheduleDate =
  targetShift.scheduleDay.scheduleDate
    .toISOString()
    .slice(0, 10);

const loginResponse = await fetch(
  `${baseUrl}/auth/login`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      loginId: "001",
      password: currentManagerPassword,
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
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      note:
        "Published shift updated by API test",
    }),
  },
);

const updateBody =
  (await updateResponse.json()) as
    ApiResponseBody;

const cancelResponse = await fetch(
  `${baseUrl}/shifts/${targetShift.id}`,
  {
    method: "DELETE",
    headers: {
      Cookie: authCookie,
    },
  },
);

const cancelBody =
  (await cancelResponse.json()) as
    ApiResponseBody;

const secondCancelResponse = await fetch(
  `${baseUrl}/shifts/${targetShift.id}`,
  {
    method: "DELETE",
    headers: {
      Cookie: authCookie,
    },
  },
);

const secondCancelBody =
  (await secondCancelResponse.json()) as
    ApiResponseBody;

const storedShift =
  await prisma.shift.findUnique({
    where: {
      id: targetShift.id,
    },
    select: {
      status: true,
      note: true,
      cancelledAt: true,
      cancelledByMembershipId: true,
      updatedByMembershipId: true,
    },
  });

const listResponse = await fetch(
  `${baseUrl}/schedule-days?from=${scheduleDate}&to=${scheduleDate}`,
  {
    headers: {
      Cookie: authCookie,
    },
  },
);

const listBody =
  (await listResponse.json()) as
    ScheduleResponseBody;

const listedShift =
  listBody.data?.scheduleDays
    ?.[0]
    ?.shifts.find(
      (shift) =>
        shift.id === targetShift.id,
    );

console.log(
  JSON.stringify(
    {
      scheduleDate,
      loginStatusCode:
        loginResponse.status,

      updateStatusCode:
        updateResponse.status,
      updatedShift:
        updateBody.data?.shift,
      updateWarningCount:
        updateBody.data?.warnings?.length,

      cancelStatusCode:
        cancelResponse.status,
      cancelMessage:
        cancelBody.message,

      storedShift: {
        exists: storedShift !== null,
        status: storedShift?.status,
        note: storedShift?.note,
        cancelledAtStored:
          storedShift?.cancelledAt !== null,
        cancellerStored:
          storedShift
            ?.cancelledByMembershipId !==
          null,
        updaterStored:
          storedShift
            ?.updatedByMembershipId !==
          null,
      },

      listedShift,

      secondCancelStatusCode:
        secondCancelResponse.status,
      secondCancelBody,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();