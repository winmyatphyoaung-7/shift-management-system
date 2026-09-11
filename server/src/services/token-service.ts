import jwt from "jsonwebtoken";
import { z } from "zod";
import { authConfig } from "../config/auth.js";

const authTokenPayloadSchema = z.object({
  userId: z.string().uuid(),
  membershipId: z.string().uuid(),
  storeId: z.string().uuid(),
  role: z.enum(["MANAGER", "STAFF"]),
});

export type AuthTokenPayload = z.infer<
  typeof authTokenPayloadSchema
>;

export function createAuthToken(
  payload: AuthTokenPayload,
): string {                                          //jwt.sign() က parameter အနေနဲ့ payload , secret key နဲ့ options(နောက်ဆက်တွဲ သတ်မှတ်ချက်တွေကို object အနေနဲ့ ပေးရပါတယ်)ကို လက်ခံပြီး token ကို generate လုပ်ပေးပါတယ်။
  return jwt.sign(payload, authConfig.jwtSecret, {  //jwt.sign() က payload ကို secret key နဲ့ sign လုပ်ပြီး token ပြန်ပေးပါတယ်။
    algorithm: "HS256",                             //algorithm: "HS256" ဆိုတာက HMAC-SHA256 algorithm ကို သုံးပြီး sign လုပ်မယ်ဆိုတာကို ပြောပါတယ်။
    expiresIn: authConfig.jwtExpiresInSeconds,
  });
}

export function verifyAuthToken(
  token: string,
): AuthTokenPayload {
  const decodedPayload = jwt.verify(
    token,
    authConfig.jwtSecret,
    {
      algorithms: ["HS256"],
    },
  );

  return authTokenPayloadSchema.parse(decodedPayload);
}