import "dotenv/config";

const baseUrl =
    "http://localhost:3000/api/v1";

const currentManagerPassword =
    process.env["CURRENT_MANAGER_PASSWORD"];

if (!currentManagerPassword) {
    throw new Error(
        "CURRENT_MANAGER_PASSWORD is required",
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

const setCookie =
    loginResponse.headers.get("set-cookie");

const authCookie =
    setCookie?.split(";")[0];

if (!authCookie) {
    throw new Error(
        "Authentication cookie was not received",
    );
}

const scheduleDaysResponse = await fetch(
    `${baseUrl}/schedule-days?from=2026-10-04&to=2026-10-04`,
    {
        headers: {
            Cookie: authCookie,
        },
    },
);

const scheduleDaysBody =
    await scheduleDaysResponse.json();

const invalidDateResponse = await fetch(
    `${baseUrl}/schedule-days?from=2026-02-30&to=2026-03-05`,
    {
        headers: {
            Cookie: authCookie,
        },
    },
);
const firstScheduleDay =
    scheduleDaysBody.data
        ?.scheduleDays?.[0];

const invalidDateBody =
    await invalidDateResponse.json();

const reversedRangeResponse = await fetch(
    `${baseUrl}/schedule-days?from=2026-09-20&to=2026-09-14`,
    {
        headers: {
            Cookie: authCookie,
        },
    },
);

const reversedRangeBody =
    await reversedRangeResponse.json();

console.log(
    JSON.stringify(
        {
            loginStatusCode:
                loginResponse.status,

            validRange: {
                statusCode:
                    scheduleDaysResponse.status,
                scheduleDate:
                    firstScheduleDay?.scheduleDate,
                coverageRequirementCount:
                    firstScheduleDay
                        ?.coverageRequirements
                        ?.length,
                shiftCount:
                    firstScheduleDay?.shifts?.length,
                warningCount:
                    firstScheduleDay
                        ?.coverageWarnings
                        ?.length,
                firstWarning:
                    firstScheduleDay
                        ?.coverageWarnings?.[0] ??
                    null,
            },
            invalidCalendarDate: {
                statusCode:
                    invalidDateResponse.status,
                body: invalidDateBody,
            },

            reversedRange: {
                statusCode:
                    reversedRangeResponse.status,
                body: reversedRangeBody,
            },
        },
        null,
        2,
    ),
);