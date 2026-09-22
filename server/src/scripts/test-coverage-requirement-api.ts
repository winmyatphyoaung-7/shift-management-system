import "dotenv/config";

import { prisma } from "../lib/prisma.js";

const baseUrl = "http://localhost:3000/api/v1";

const currentManagerPassword =
    process.env["CURRENT_MANAGER_PASSWORD"];

if (!currentManagerPassword) {
    throw new Error(
        "CURRENT_MANAGER_PASSWORD is required",
    );
}

const requirement =
    await prisma.coverageRequirement.findFirst({
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            requiredCount: true,
        },
    });

if (!requirement) {
    throw new Error(
        "A coverage requirement is required for this test",
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

const nextRequiredCount =
    requirement.requiredCount === 3 ? 4 : 3;

const updateResponse = await fetch(
    `${baseUrl}/coverage-requirements/${requirement.id}`,
    {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Cookie: authCookie,
        },
        body: JSON.stringify({
            requiredCount: nextRequiredCount,
        }),
    },
);

const updateBody = await updateResponse.json();

const invalidResponse = await fetch(
    `${baseUrl}/coverage-requirements/${requirement.id}`,
    {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Cookie: authCookie,
        },
        body: JSON.stringify({
            requiredCount: 0,
        }),
    },
);

const invalidBody =
    await invalidResponse.json();

const storedRequirement =
    await prisma.coverageRequirement.findUnique({
        where: {
            id: requirement.id,
        },
        select: {
            requiredCount: true,
        },
    });

console.log(
    JSON.stringify(
        {
            loginStatusCode: loginResponse.status,
            previousRequiredCount:
                requirement.requiredCount,
            updateStatusCode:
                updateResponse.status,
            updatedCoverageRequirement:
                updateBody.data?.coverageRequirement,
            warningCount:
                updateBody.data?.warnings?.length,
            firstWarning:
                updateBody.data?.warnings?.[0] ?? null,
            storedRequiredCount:
                storedRequirement?.requiredCount,
            invalidStatusCode:
                invalidResponse.status,
            invalidBody,
        },
        null,
        2,
    ),
);

await prisma.$disconnect();