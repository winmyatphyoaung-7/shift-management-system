import "dotenv/config";

import { randomBytes } from "node:crypto";

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

type ApiResponseBody = {
    status?: string;
    code?: string;
    message?: string;
    details?: unknown;
    data?: {
        member?: {
            id: string;
            loginId: string;
        };
        shifts?: Array<{
            id: string;
        }>;
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

const existingLoginIds =
    await prisma.storeMember.findMany({
        where: {
            storeId: manager.storeId,
        },
        select: {
            loginId: true,
        },
    });

const usedLoginIds = new Set(
    existingLoginIds.map(
        (membership) =>
            membership.loginId,
    ),
);

let availableLoginId: string | null =
    null;

for (
    let value = 999;
    value >= 100;
    value -= 1
) {
    const candidate = String(value);

    if (!usedLoginIds.has(candidate)) {
        availableLoginId = candidate;
        break;
    }
}

if (!availableLoginId) {
    throw new Error(
        "An available three-digit login ID is required",
    );
}

const temporaryPassword =
    `Temp-${randomBytes(12).toString("hex")}!`;

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

const createMemberResponse = await fetch(
    `${baseUrl}/members`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: authCookie,
        },
        body: JSON.stringify({
            name: "Future Shift Guard Test",
            loginId: availableLoginId,
            temporaryPassword,
            confirmPassword:
                temporaryPassword,
            colorKey: "green",
        }),
    },
);

const createMemberBody =
    (await createMemberResponse.json()) as
    ApiResponseBody;

const testMembershipId =
    createMemberBody.data?.member?.id;

if (!testMembershipId) {
    throw new Error(
        `Test member creation failed: ${JSON.stringify(createMemberBody)}`,
    );
}

const scheduleDate = "2026-11-02";

const startAt =
    createDateTimeInTimeZone(
        scheduleDate,
        preset.startMinute,
        manager.store.timeZone,
    );

const endAt =
    createDateTimeInTimeZone(
        scheduleDate,
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
            scheduleDate,
            shiftPresetId: preset.id,
            assigneeMembershipIds: [
                testMembershipId,
            ],
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            note:
                "Future shift deactivation guard test",
        }),
    },
);

const createShiftBody =
    (await createShiftResponse.json()) as
    ApiResponseBody;

const testShiftId =
    createShiftBody.data?.shifts?.[0]?.id;

if (!testShiftId) {
    throw new Error(
        `Test shift creation failed: ${createShiftBody.code ?? "UNKNOWN_ERROR"}`,
    );
}

const blockedResponse = await fetch(
    `${baseUrl}/members/${testMembershipId}/deactivate`,
    {
        method: "POST",
        headers: {
            Cookie: authCookie,
        },
    },
);

const blockedBody =
    (await blockedResponse.json()) as
    ApiResponseBody;

const deleteShiftResponse = await fetch(
    `${baseUrl}/shifts/${testShiftId}`,
    {
        method: "DELETE",
        headers: {
            Cookie: authCookie,
        },
    },
);

const deleteShiftBody =
    (await deleteShiftResponse.json()) as
    ApiResponseBody;

const deactivateResponse = await fetch(
    `${baseUrl}/members/${testMembershipId}/deactivate`,
    {
        method: "POST",
        headers: {
            Cookie: authCookie,
        },
    },
);

const deactivateBody =
    (await deactivateResponse.json()) as
    ApiResponseBody;

const storedMembership =
    await prisma.storeMember.findUnique({
        where: {
            id: testMembershipId,
        },
        select: {
            status: true,
        },
    });

console.log(
    JSON.stringify(
        {
            loginStatusCode:
                loginResponse.status,
            testLoginId: availableLoginId,
            createMemberStatusCode:
                createMemberResponse.status,
            createShiftStatusCode:
                createShiftResponse.status,

            blockedDeactivateStatusCode:
                blockedResponse.status,
            blockedDeactivateBody:
                blockedBody,

            deleteShiftStatusCode:
                deleteShiftResponse.status,
            deleteShiftMessage:
                deleteShiftBody.message,

            finalDeactivateStatusCode:
                deactivateResponse.status,
            finalDeactivateMessage:
                deactivateBody.message,

            storedMemberStatus:
                storedMembership?.status,
        },
        null,
        2,
    ),
);

await prisma.$disconnect();