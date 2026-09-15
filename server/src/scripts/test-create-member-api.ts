import "dotenv/config";

const baseUrl = "http://localhost:3000/api/v1";

const currentManagerPassword =
  process.env["CURRENT_MANAGER_PASSWORD"];

const newStaffTemporaryPassword =
  process.env["NEW_STAFF_TEMP_PASSWORD"];

if (!currentManagerPassword) {
  throw new Error(
    "CURRENT_MANAGER_PASSWORD is required",
  );
}

if (!newStaffTemporaryPassword) {
  throw new Error(
    "NEW_STAFF_TEMP_PASSWORD is required",
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

const authCookie = setCookie?.split(";")[0];

if (!authCookie) {
  throw new Error(
    "Manager authentication cookie was not received",
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
      name: "Demo Staff",
      loginId: "002",
      temporaryPassword:
        newStaffTemporaryPassword,
      confirmPassword:
        newStaffTemporaryPassword,
      colorKey: "green",
    }),
  },
);

const responseBody =
  await createMemberResponse.json();

console.log(
  JSON.stringify(
    {
      loginStatusCode: loginResponse.status,
      createMemberStatusCode:
        createMemberResponse.status,
      responseBody,
    },
    null,
    2,
  ),
);