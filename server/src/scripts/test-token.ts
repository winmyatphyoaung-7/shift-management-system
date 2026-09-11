import "dotenv/config";

import {
  createAuthToken,
  verifyAuthToken,
} from "../services/token-service.js";

const token = createAuthToken({
  userId: "11111111-1111-4111-8111-111111111111",
  membershipId: "22222222-2222-4222-8222-222222222222",
  storeId: "33333333-3333-4333-8333-333333333333",
  role: "MANAGER",
});


const payload = verifyAuthToken(token);

console.log({
  tokenCreated: Boolean(token),
  payload,
});