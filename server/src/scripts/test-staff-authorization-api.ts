import "dotenv/config";

const baseUrl = "http://localhost:3000/api/v1";

const currentStaffPassword =
  process.env["CURRENT_STAFF_PASSWORD"];

if (!currentStaffPassword) {
  throw new Error(
    "STAFF_TEMP_PASSWORD is required",
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
      loginId: "002",
      password: currentStaffPassword,
    }),
  },
);

const setCookie =
  loginResponse.headers.get("set-cookie");

const authCookie = setCookie?.split(";")[0];

if (!authCookie) {
  throw new Error(
    "Staff authentication cookie was not received",
  );
}

const membersResponse = await fetch(
  `${baseUrl}/members`,
  {
    headers: {
      Cookie: authCookie,
    },
  },
);

const responseBody =
  await membersResponse.json();

console.log(
  JSON.stringify(
    {
      loginStatusCode: loginResponse.status,
      membersStatusCode: membersResponse.status,
      responseBody,
    },
    null,
    2,
  ),
);