import type {
  CookieOptions,
  Response,
} from "express";

import { authConfig } from "../config/auth.js";

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: authConfig.isProduction,
  sameSite: "lax",
  maxAge: authConfig.jwtExpiresInSeconds * 1000,
  path: "/",
};

 // ဒိ function က Cookie ထည့်ပေးရုံဘဲဖြစ်ပြီး ဘာမှပြန်မပေးတဲ့အတွက် return type ကို void လို့သတ်မှတ်ထားတာပါ။
 // res.cookie() ဆိုတာက Express.js မှာ Cookie ထည့်ပေးတဲ့ function ပါ။
 //သူက parameter သုံးခုလိုက်တယ်။ ပထမတစ်ခုက cookie name
 // ဒုတိယတစ်ခုက cookie value (cookie ထဲမှာ သိမ်းမယ့် token)
 // တတိယတစ်ခုက cookie options(Cookie ရဲ့ သက်တမ်းနဲ့ လုံခြုံရေးဆိုင်ရာ Config များ)။ သူက မထည့်လည်းရ
export function setAuthCookie(
  res: Response,
  token: string,
): void {
  res.cookie(
    authConfig.cookieName,
    token,
    authCookieOptions,
  );
}

export function clearAuthCookie(
  res: Response,
): void {
  res.clearCookie(authConfig.cookieName, {
    httpOnly: true,
    secure: authConfig.isProduction,
    sameSite: "lax",
    path: "/",
  });
}