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

const draftRange = {
  from: "2026-10-19",
  to: "2026-10-25",
};

type ClearRangeResponseBody = {
  status?: string;
  code?: string;
  message?: string;
  data?: {
    cleared?: boolean;
    preview?: {
      scheduleDayCount: number;
      shiftCount: number;
      coverageRequirementCount: number;
    };
    deletedScheduleDayCount?: number;
    deletedShiftCount?: number;
    deletedCoverageRequirementCount?:
      number;
  };
};

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
    "An active manager is required",
  );
}

const targetDaysBefore =
  await prisma.scheduleDay.findMany({
    where: {
      storeId: manager.storeId,
      scheduleDate: {
        gte: new Date(
          `${draftRange.from}T00:00:00.000Z`,
        ),
        lte: new Date(
          `${draftRange.to}T00:00:00.000Z`,
        ),
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

if (targetDaysBefore.length === 0) {
  throw new Error(
    "The Copy Week test Draft range is required",
  );
}

if (
  targetDaysBefore.some(
    (scheduleDay) =>
      scheduleDay.status !== "DRAFT",
  )
) {
  throw new Error(
    "Safety check failed: the target range contains a non-Draft day",
  );
}

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

const previewResponse = await fetch(
  `${baseUrl}/schedule-days/draft-range`,
  {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify(draftRange),
  },
);

const previewBody =
  (await previewResponse.json()) as
    ClearRangeResponseBody;

const countAfterPreview =
  await prisma.scheduleDay.count({
    where: {
      storeId: manager.storeId,
      scheduleDate: {
        gte: new Date(
          `${draftRange.from}T00:00:00.000Z`,
        ),
        lte: new Date(
          `${draftRange.to}T00:00:00.000Z`,
        ),
      },
    },
  });

const clearResponse = await fetch(
  `${baseUrl}/schedule-days/draft-range`,
  {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      ...draftRange,
      confirmed: true,
    }),
  },
);

const clearBody =
  (await clearResponse.json()) as
    ClearRangeResponseBody;

const countAfterClear =
  await prisma.scheduleDay.count({
    where: {
      storeId: manager.storeId,
      scheduleDate: {
        gte: new Date(
          `${draftRange.from}T00:00:00.000Z`,
        ),
        lte: new Date(
          `${draftRange.to}T00:00:00.000Z`,
        ),
      },
    },
  });

const publishedRangeResponse = await fetch(
  `${baseUrl}/schedule-days/draft-range`,
  {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      from: "2026-10-03",
      to: "2026-10-05",
    }),
  },
);

const publishedRangeBody =
  (await publishedRangeResponse.json()) as
    ClearRangeResponseBody;

const publishedDaysStillExist =
  await prisma.scheduleDay.count({
    where: {
      storeId: manager.storeId,
      status: "PUBLISHED",
      scheduleDate: {
        gte: new Date(
          "2026-10-03T00:00:00.000Z",
        ),
        lte: new Date(
          "2026-10-05T00:00:00.000Z",
        ),
      },
    },
  });

console.log(
  JSON.stringify(
    {
      loginStatusCode:
        loginResponse.status,

      targetCountBefore:
        targetDaysBefore.length,

      previewStatusCode:
        previewResponse.status,
      previewResult:
        previewBody.data,
      countAfterPreview,

      clearStatusCode:
        clearResponse.status,
      clearResult:
        clearBody.data,
      countAfterClear,

      publishedRangeStatusCode:
        publishedRangeResponse.status,
      publishedRangeBody,
      publishedDaysStillExist,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();