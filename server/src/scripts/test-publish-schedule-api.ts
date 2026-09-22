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

type PublishResponseBody = {
  status?: string;
  code?: string;
  message?: string;
  data?: {
    publishedDays?: Array<{
      scheduleDate: string;
      status: string;
      shiftCount: number;
      coverageWarnings: unknown[];
    }>;
    summary?: {
      publishedDateCount: number;
      shiftCount: number;
      coverageWarningCount: number;
    };
  };
};

type ScheduleDaysResponseBody = {
  data?: {
    scheduleDays?: Array<{
      scheduleDate: string;
      status: string;
      publishedAt: string | null;
      publishedByMembershipId:
        string | null;
      coverageRequirements: unknown[];
      shifts: unknown[];
      coverageWarnings: unknown[];
    }>;
  };
};

const publishRange = {
  from: "2026-10-03",
  to: "2026-10-05",
};

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

const publishResponse = await fetch(
  `${baseUrl}/schedule-days/publish`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify(publishRange),
  },
);

const publishBody =
  (await publishResponse.json()) as
    PublishResponseBody;

const listResponse = await fetch(
  `${baseUrl}/schedule-days?from=${publishRange.from}&to=${publishRange.to}`,
  {
    headers: {
      Cookie: authCookie,
    },
  },
);

const listBody =
  (await listResponse.json()) as
    ScheduleDaysResponseBody;

const secondPublishResponse = await fetch(
  `${baseUrl}/schedule-days/publish`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify(publishRange),
  },
);

const secondPublishBody =
  (await secondPublishResponse.json()) as
    PublishResponseBody;

console.log(
  JSON.stringify(
    {
      loginStatusCode:
        loginResponse.status,

      publishStatusCode:
        publishResponse.status,

      publishSummary:
        publishBody.data?.summary,

      publishedDays:
        publishBody.data?.publishedDays?.map(
          (scheduleDay) => ({
            scheduleDate:
              scheduleDay.scheduleDate,
            status: scheduleDay.status,
            shiftCount:
              scheduleDay.shiftCount,
            warningCount:
              scheduleDay
                .coverageWarnings.length,
          }),
        ),

      listStatusCode:
        listResponse.status,

      storedDays:
        listBody.data?.scheduleDays?.map(
          (scheduleDay) => ({
            scheduleDate:
              scheduleDay.scheduleDate,
            status: scheduleDay.status,
            published:
              scheduleDay.publishedAt !==
              null,
            publisherStored:
              scheduleDay
                .publishedByMembershipId !==
              null,
            coverageRequirementCount:
              scheduleDay
                .coverageRequirements.length,
            shiftCount:
              scheduleDay.shifts.length,
            warningCount:
              scheduleDay
                .coverageWarnings.length,
          }),
        ),

      secondPublishStatusCode:
        secondPublishResponse.status,

      secondPublishBody,
    },
    null,
    2,
  ),
);