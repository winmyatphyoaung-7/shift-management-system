import "dotenv/config";

async function main(): Promise<void> {
  const temporaryPassword =
    process.env["SEED_MANAGER_TEMP_PASSWORD"];

  if (!temporaryPassword) {
    throw new Error(
      "SEED_MANAGER_TEMP_PASSWORD is missing",
    );
  }

  const loginResponse = await fetch(
    "http://localhost:3000/api/v1/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginId: "001",
        password: temporaryPassword,
      }),
    },
  );

  const loginBody: unknown =
    await loginResponse.json();

  const setCookieHeader =
    loginResponse.headers.get("set-cookie");

  if (!setCookieHeader) {
    throw new Error(
      "Login response did not include a cookie",
    );
  }

  const cookie = setCookieHeader.split(";")[0];

  if (!cookie) {
    throw new Error(
      "Authentication cookie could not be read",
    );
  }

  const meResponse = await fetch(
    "http://localhost:3000/api/v1/auth/me",
    {
      headers: {
        Cookie: cookie,
      },
    },
  );

  const meBody: unknown = await meResponse.json();

  console.log({
    loginStatusCode: loginResponse.status,
    cookieReceived: true,
    loginBody,
    meStatusCode: meResponse.status,
    meBody,
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});