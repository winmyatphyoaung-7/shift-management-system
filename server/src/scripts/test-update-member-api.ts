import "dotenv/config";

const baseUrl = "http://localhost:3000/api/v1";

const currentManagerPassword =
  process.env["CURRENT_MANAGER_PASSWORD"];

if (!currentManagerPassword) {
  throw new Error(
    "CURRENT_MANAGER_PASSWORD is required",
  );
}

type MembersResponseBody = {
  status: string;
  data?: {
    members?: Array<{
      id: string;
      loginId: string;
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

const membersResponse = await fetch(
  `${baseUrl}/members`,
  {
    headers: {
      Cookie: authCookie,
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

const updateResponse = await fetch(
  `${baseUrl}/members/${staffMember.id}`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({
      name: "Demo Staff Updated",
      colorKey: "teal",
    }),
  },
);

const updateBody =
  await updateResponse.json();

console.log(
  JSON.stringify(
    {
      loginStatusCode: loginResponse.status,
      listStatusCode: membersResponse.status,
      updateStatusCode: updateResponse.status,
      updateBody,
    },
    null,
    2,
  ),
);