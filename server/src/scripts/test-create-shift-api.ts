import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import {
    createDateTimeInTimeZone,
    formatDateInTimeZone,
} from "../utils/schedule-time.js";

const baseUrl =
    "http://localhost:3000/api/v1";

const currentManagerPassword =
    process.env["CURRENT_MANAGER_PASSWORD"];

if (!currentManagerPassword) {
    throw new Error(
        "CURRENT_MANAGER_PASSWORD is required",
    );
}

async function findUnusedScheduleDate(
    storeId: string,
    timeZone: string,
): Promise<string> {
    const millisecondsPerDay =
        24 * 60 * 60 * 1000;

    for (
        let daysAhead = 14;
        daysAhead <= 60;
        daysAhead += 1
    ) {
        const candidate = new Date(
            Date.now() +
            daysAhead * millisecondsPerDay,
        );

        const scheduleDate =
            formatDateInTimeZone(
                candidate,
                timeZone,
            );

        const existingScheduleDay =
            await prisma.scheduleDay.findUnique({
                where: {
                    storeId_scheduleDate: {
                        storeId,
                        scheduleDate: new Date(
                            `${scheduleDate}T00:00:00.000Z`,
                        ),
                    },
                },
                select: {
                    id: true,
                },
            });

        if (!existingScheduleDay) {
            return scheduleDate;
        }
    }

    throw new Error(
        "No unused future schedule date was found",
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
            "Active manager was not found",
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
            "Active shift preset was not found",
        );
    }

    const scheduleDate =
        await findUnusedScheduleDate(
            manager.storeId,
            manager.store.timeZone,
        );

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

    const createRequestBody = {
        scheduleDate,
        shiftPresetId: preset.id,
        assigneeMembershipIds: [
            manager.id,
        ],
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        note: "Draft shift API test",
    };

    const createResponse = await fetch(
        `${baseUrl}/shifts`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
                Cookie: authCookie,
            },
            body: JSON.stringify(
                createRequestBody,
            ),
        },
    );

    const createBody =
        await createResponse.json();

    const overlapResponse = await fetch(
        `${baseUrl}/shifts`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
                Cookie: authCookie,
            },
            body: JSON.stringify(
                createRequestBody,
            ),
        },
    );

    const overlapBody =
        await overlapResponse.json();

    const adjacentEndAt = new Date(
        endAt.getTime() +
        4 * 60 * 60 * 1000,
    );

    const adjacentResponse = await fetch(
        `${baseUrl}/shifts`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
                Cookie: authCookie,
            },
            body: JSON.stringify({
                scheduleDate,
                assigneeMembershipIds: [
                    manager.id,
                ],
                startAt: endAt.toISOString(),
                endAt:
                    adjacentEndAt.toISOString(),
                note: "Adjacent shift API test",
            }),
        },
    );

    const adjacentBody =
        await adjacentResponse.json();

    const invalidStartAt = new Date(
        startAt.getTime() +
        15 * 60 * 1000,
    );

    const invalidEndAt = new Date(
        endAt.getTime() +
        15 * 60 * 1000,
    );

    const invalidIncrementResponse =
        await fetch(
            `${baseUrl}/shifts`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Cookie: authCookie,
                },
                body: JSON.stringify({
                    scheduleDate,
                    assigneeMembershipIds: [
                        manager.id,
                    ],
                    startAt:
                        invalidStartAt.toISOString(),
                    endAt:
                        invalidEndAt.toISOString(),
                }),
            },
        );

    const invalidIncrementBody =
        await invalidIncrementResponse.json();

    const listResponse = await fetch(
        `${baseUrl}/schedule-days?from=${scheduleDate}&to=${scheduleDate}`,
        {
            headers: {
                Cookie: authCookie,
            },
        },
    );

    const listBody =
        await listResponse.json();

    console.log(
        JSON.stringify(
            {
                scheduleDate,
                presetName: preset.name,
                loginStatusCode:
                    loginResponse.status,
                createStatusCode:
                    createResponse.status,
                createBody,
                listStatusCode:
                    listResponse.status,
                listBody,
                overlapStatusCode:
                    overlapResponse.status,
                overlapBody,
                adjacentStatusCode:
                    adjacentResponse.status,
                adjacentBody,
                invalidIncrementStatusCode:
                    invalidIncrementResponse.status,
                invalidIncrementBody,
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