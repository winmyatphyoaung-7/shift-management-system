import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import { createDateTimeInTimeZone } from "../utils/schedule-time.js";

const baseUrl =
  "http://localhost:3000/api/v1";

const currentManagerPassword =
  process.env["CURRENT_MANAGER_PASSWORD"];

if (!currentManagerPassword) {
  throw new Error(
    "CURRENT_MANAGER_PASSWORD is required",
  );
}

const sourceWeekStart = "2026-10-12";
const targetWeekStart = "2026-10-19";
const targetWeekEnd = "2026-10-25";

type ApiResponseBody = {
  status?: string;
  code?: string;
  message?: string;
  data?: {
    copied?: boolean;
    preview?: {
      sourceShiftCount: number;
      copyableShiftCount: number;
      skippedShiftCount: number;
      warnings: unknown[];
    };
    createdScheduleDayCount?: number;
    createdShiftCount?: number;
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
      id: true,
      storeId: true,
      store: {
        select: {
          timeZone: true,
        },
      },
    },
  });

if (!manager) {
  throw new Error(
    "An active manager is required",
  );
}

const preset =
  await prisma.shiftPreset.findFirst({
    where: {
      storeId: manager.storeId,
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      name: true,
      startMinute: true,
      endMinute: true,
      crossesMidnight: true,
    },
  });

if (!preset) {
  throw new Error(
    "An active shift preset is required",
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

const sourceStartAt =
  createDateTimeInTimeZone(
    sourceWeekStart,
    preset.startMinute,
    manager.store.timeZone,
  );

const sourceEndAt =
  createDateTimeInTimeZone(
    sourceWeekStart,
    preset.endMinute,
    manager.store.timeZone,
    preset.crossesMidnight ? 1 : 0,
  );

const createShiftResponse = await fetch(
  `${baseUrl}/shifts`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      scheduleDate: sourceWeekStart,
      shiftPresetId: preset.id,
      assigneeMembershipIds: [
        manager.id,
      ],
      startAt:
        sourceStartAt.toISOString(),
      endAt:
        sourceEndAt.toISOString(),
      note: "Copy Week API test",
    }),
  },
);

const createShiftBody =
  (await createShiftResponse.json()) as {
    data?: {
      shifts?: Array<{
        id: string;
      }>;
    };
    code?: string;
    message?: string;
  };

const sourceShiftId =
  createShiftBody.data?.shifts?.[0]?.id;

if (!sourceShiftId) {
  throw new Error(
    `Source shift creation failed: ${createShiftBody.code ?? "UNKNOWN_ERROR"}`,
  );
}

const copyRequestBody = {
  sourceWeekStart,
  targetWeekStart,
};

const previewResponse = await fetch(
  `${baseUrl}/schedule-days/copy-week`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify(copyRequestBody),
  },
);

const previewBody =
  (await previewResponse.json()) as
    ApiResponseBody;

const targetCountAfterPreview =
  await prisma.scheduleDay.count({
    where: {
      storeId: manager.storeId,
      scheduleDate: {
        gte: new Date(
          `${targetWeekStart}T00:00:00.000Z`,
        ),
        lte: new Date(
          `${targetWeekEnd}T00:00:00.000Z`,
        ),
      },
    },
  });

const copyResponse = await fetch(
  `${baseUrl}/schedule-days/copy-week`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      ...copyRequestBody,
      confirmed: true,
    }),
  },
);

const copyBody =
  (await copyResponse.json()) as
    ApiResponseBody;

const copiedShift =
  await prisma.shift.findFirst({
    where: {
      note: "Copy Week API test",
      id: {
        not: sourceShiftId,
      },
      scheduleDay: {
        storeId: manager.storeId,
        scheduleDate: new Date(
          `${targetWeekStart}T00:00:00.000Z`,
        ),
      },
    },
    select: {
      id: true,
      assigneeMembershipId: true,
      shiftPresetId: true,
      startAt: true,
      endAt: true,
      breakMinutes: true,
      note: true,
      status: true,
      scheduleDay: {
        select: {
          status: true,
        },
      },
    },
  });

const targetScheduleDayCount =
  await prisma.scheduleDay.count({
    where: {
      storeId: manager.storeId,
      scheduleDate: {
        gte: new Date(
          `${targetWeekStart}T00:00:00.000Z`,
        ),
        lte: new Date(
          `${targetWeekEnd}T00:00:00.000Z`,
        ),
      },
    },
  });

const secondCopyResponse = await fetch(
  `${baseUrl}/schedule-days/copy-week`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      ...copyRequestBody,
      confirmed: true,
    }),
  },
);

const secondCopyBody =
  (await secondCopyResponse.json()) as
    ApiResponseBody;

console.log(
  JSON.stringify(
    {
      presetName: preset.name,
      loginStatusCode:
        loginResponse.status,
      createShiftStatusCode:
        createShiftResponse.status,

      previewStatusCode:
        previewResponse.status,
      preview: previewBody.data,
      targetCountAfterPreview,

      copyStatusCode:
        copyResponse.status,
      copyResult: copyBody.data,

      targetScheduleDayCount,

      copiedShift: {
        exists: copiedShift !== null,
        hasNewId:
          copiedShift?.id !== sourceShiftId,
        assigneePreserved:
          copiedShift
            ?.assigneeMembershipId ===
          manager.id,
        presetPreserved:
          copiedShift?.shiftPresetId ===
          preset.id,
        status: copiedShift?.status,
        scheduleDayStatus:
          copiedShift?.scheduleDay.status,
        startShiftedBySevenDays:
          copiedShift?.startAt.getTime() ===
          sourceStartAt.getTime() +
            7 * 24 * 60 * 60 * 1000,
        endShiftedBySevenDays:
          copiedShift?.endAt.getTime() ===
          sourceEndAt.getTime() +
            7 * 24 * 60 * 60 * 1000,
      },

      secondCopyStatusCode:
        secondCopyResponse.status,
      secondCopyBody,
    },
    null,
    2,
  ),
);

await prisma.$disconnect();