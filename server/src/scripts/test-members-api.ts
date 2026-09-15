import "dotenv/config";

const baseUrl = "http://localhost:3000/api/v1";

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

const authCookie = setCookie?.split(";")[0];

if (!authCookie) {
  throw new Error(
    "Authentication cookie was not received",
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

const membersBody =
  await membersResponse.json();

console.log(
  JSON.stringify(
    {
      loginStatusCode: loginResponse.status,
      membersStatusCode: membersResponse.status,
      membersBody,
    },
    null,
    2,
  ),
);