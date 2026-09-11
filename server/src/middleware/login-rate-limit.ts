import { rateLimit } from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //windowMs က mili seconds ဘဲလက်ခံတာကြောင့် ၁၅မနစ်ကို ms အဖြစ်ပြောင်းထားတာပါ။
  limit: 10,                // ၁၅ မိနစ်အတွင်း login လုပ်ဖို့ကြိုးစားမှု ၁၀ ကြိမ်ထက်မပိုရအောင် အကန့်အသတ်ထားတာပါ။

  standardHeaders: "draft-8",
  legacyHeaders: false,

  skipSuccessfulRequests: true, // login လုပ်ပြီး အောင်မြင်တဲ့ request တွေကို rate limit ထဲမှာ မတွက်ပါဘူး။

  message: {
    status: "error",
    code: "TOO_MANY_LOGIN_ATTEMPTS",
    message:
      "Too many login attempts. Please try again later.",
  },
});