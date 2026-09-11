const jwtSecret = process.env["JWT_SECRET"];
const jwtExpiresInSeconds = Number(
  process.env["JWT_EXPIRES_IN_SECONDS"] ?? 28800,
);

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    "JWT_SECRET must exist and contain at least 32 characters",
  );
}

if (
  !Number.isInteger(jwtExpiresInSeconds) ||
  jwtExpiresInSeconds <= 0
) {
  throw new Error(
    "JWT_EXPIRES_IN_SECONDS must be a positive integer",
  );
}

export const authConfig = {
  jwtSecret,   //Variable Name နဲ့ Object Key နာမည် တူနေသည့်အတွက် ES6 Short-hand ရေးနည်းဖြင့် jwtSecret: jwtSecret အစား jwtSecret ဟု အတိုချုံ့ ရေးထားခြင်း ဖြစ်ပါတယ်။
  jwtExpiresInSeconds,
  cookieName: "shift_auth",
  isProduction: process.env["NODE_ENV"] === "production",
} as const;// as const ဆိုတာက TypeScript ကို ဒီ object ရဲ့ properties တွေကို literal types အနေနဲ့ treat လုပ်ဖို့ ပြောတာပါ။
           // နောက်ပြီး ဒီ object ရဲ့ properties တွေကို ပြောင်းလဲမရတဲ့ (read-only) အဖြစ် treat လုပ်ဖို့လည်း ပြောတာပါ။