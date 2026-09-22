import "dotenv/config";

const baseUrl =
  "http://localhost:3000/api/v1";

const currentStaffPassword =
  process.env["CURRENT_STAFF_PASSWORD"];

const newStaffPassword =
  process.env["NEW_STAFF_PASSWORD"];

if (!currentStaffPassword) {
  throw new Error(
    "CURRENT_STAFF_PASSWORD is required",
  );
}

type ApiResponseBody = {
  status?: string;
  code?: string;
  message?: string;
};

type ScheduleDaysResponseBody =
  ApiResponseBody & {
    data?: {
      scheduleDays?: Array<{
        scheduleDate: string;
        status: string;
      }>;
    };
  };

const loginResponse = await fetch(
  `${baseUrl}/auth/login`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      loginId: "002",
      password: currentStaffPassword,
    }),
  },
);

let authCookie =
  loginResponse.headers
    .get("set-cookie")
    ?.split(";")[0];

if (!authCookie) {
  throw new Error(
    "Staff authentication cookie was not received",
  );
}

async function getPublishedSchedule(
  cookie: string,
) {
  const response = await fetch(
    `${baseUrl}/schedule-days?from=2026-10-01&to=2026-10-05`,
    {
      headers: {
        Cookie: cookie,
      },
    },
  );

  const body =
    (await response.json()) as
      ScheduleDaysResponseBody;

  return {
    response,
    body,
  };
}

let {
  response: scheduleResponse,
  body: scheduleBody,
} = await getPublishedSchedule(
  authCookie,
);

let changePasswordStatusCode:
  number | null = null;

if (
  scheduleResponse.status === 403 &&
  scheduleBody.code ===
    "PASSWORD_CHANGE_REQUIRED"
) {
  if (!newStaffPassword) {
    throw new Error(
      "NEW_STAFF_PASSWORD is required because the staff member must change the temporary password",
    );
  }

  const changePasswordResponse =
    await fetch(
      `${baseUrl}/auth/change-password`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Cookie: authCookie,
        },
        body: JSON.stringify({
          currentPassword:
            currentStaffPassword,
          newPassword:
            newStaffPassword,
          confirmPassword:
            newStaffPassword,
        }),
      },
    );

  const changePasswordBody =
    (await changePasswordResponse.json()) as
      ApiResponseBody;

  changePasswordStatusCode =
    changePasswordResponse.status;

  if (
    changePasswordResponse.status !== 200
  ) {
    throw new Error(
      `Password change failed: ${changePasswordBody.code ?? "UNKNOWN_ERROR"}`,
    );
  }

  authCookie =
    changePasswordResponse.headers
      .get("set-cookie")
      ?.split(";")[0] ??
    authCookie;

  ({
    response: scheduleResponse,
    body: scheduleBody,
  } = await getPublishedSchedule(
    authCookie,
  ));
}

const scheduleDays =
  scheduleBody.data?.scheduleDays ?? [];

const draftVisible = scheduleDays.some(
  (scheduleDay) =>
    scheduleDay.status === "DRAFT",
);

console.log(
  JSON.stringify(
    {
      loginStatusCode:
        loginResponse.status,
      changePasswordStatusCode,
      scheduleStatusCode:
        scheduleResponse.status,
      visibleScheduleDays:
        scheduleDays.map(
          (scheduleDay) => ({
            scheduleDate:
              scheduleDay.scheduleDate,
            status: scheduleDay.status,
          }),
        ),
      draftVisible,
      responseError:
        scheduleResponse.status === 200
          ? null
          : {
              code: scheduleBody.code,
              message:
                scheduleBody.message,
            },
    },
    null,
    2,
  ),
);