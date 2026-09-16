import "dotenv/config";

const baseUrl = "http://localhost:3000/api/v1";

const managerPassword =
  process.env["CURRENT_MANAGER_PASSWORD"];

const currentStaffPassword =
  process.env["CURRENT_STAFF_PASSWORD"];

const resetStaffTemporaryPassword =
  process.env["RESET_STAFF_TEMP_PASSWORD"];

if (
  !managerPassword ||
  !currentStaffPassword ||
  !resetStaffTemporaryPassword
) {
  throw new Error(
    "Required password environment variables are missing",
  );
}

type MembersResponseBody = {
  data?: {
    members?: Array<{
      id: string;
      loginId: string;
      mustChangePassword: boolean;
    }>;
  };
};

async function login(
  loginId: string,
  password: string,
) {
  return fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      loginId,
      password,
    }),
  });
}

const managerLoginResponse = await login(
  "001",
  managerPassword,
);

const managerCookie =
  managerLoginResponse.headers
    .get("set-cookie")
    ?.split(";")[0];

if (!managerCookie) {
  throw new Error(
    "Manager authentication cookie was not received",
  );
}

const membersResponse = await fetch(
  `${baseUrl}/members`,
  {
    headers: {
      Cookie: managerCookie,
    },
  },
);

const membersBody =
  (await membersResponse.json()) as MembersResponseBody;

const staffMember =
  membersBody.data?.members?.find(
    (member) => member.loginId === "002",
  );

if (!staffMember) {
  throw new Error(
    "Demo Staff with login ID 002 was not found",
  );
}

const resetResponse = await fetch(
  `${baseUrl}/members/${staffMember.id}/reset-password`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: managerCookie,
    },
    body: JSON.stringify({
      temporaryPassword:
        resetStaffTemporaryPassword,
      confirmPassword:
        resetStaffTemporaryPassword,
    }),
  },
);

const resetBody = await resetResponse.json();

const updatedMembersResponse = await fetch(
  `${baseUrl}/members`,
  {
    headers: {
      Cookie: managerCookie,
    },
  },
);

const updatedMembersBody =
  (await updatedMembersResponse.json()) as MembersResponseBody;

const updatedStaff =
  updatedMembersBody.data?.members?.find(
    (member) => member.loginId === "002",
  );

const oldPasswordLoginResponse = await login(
  "002",
  currentStaffPassword,
);

const temporaryPasswordLoginResponse =
  await login(
    "002",
    resetStaffTemporaryPassword,
  );

const staffCookie =
  temporaryPasswordLoginResponse.headers
    .get("set-cookie")
    ?.split(";")[0];

if (!staffCookie) {
  throw new Error(
    "Staff authentication cookie was not received",
  );
}

const managerRouteResponse = await fetch(
  `${baseUrl}/members`,
  {
    headers: {
      Cookie: staffCookie,
    },
  },
);

const managerRouteBody =
  await managerRouteResponse.json();

console.log(
  JSON.stringify(
    {
      managerLoginStatusCode:
        managerLoginResponse.status,
      resetStatusCode: resetResponse.status,
      resetBody,
      mustChangePasswordAfterReset:
        updatedStaff?.mustChangePassword,
      oldPasswordRejected:
        oldPasswordLoginResponse.status === 401,
      temporaryPasswordAccepted:
        temporaryPasswordLoginResponse.status === 200,
      managerRouteStatusCode:
        managerRouteResponse.status,
      managerRouteBody,
    },
    null,
    2,
  ),
);