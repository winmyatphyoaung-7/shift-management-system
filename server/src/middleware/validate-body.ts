import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error.js";

export function validateBody(
  schema: ZodType,
): RequestHandler {
  return (req, _res, next) => {
    //safeParse ရဲ့ အားသာချက်: Data မှားနေရင်တောင် Error အကြမ်းပစ်မထုတ်ဘဲ { success: true, data: ... } သို့မဟုတ် { success: false, error: ... } ဆိုပြီး Result Object အဖြစ် နူးညံ့စွာ ပြန်ပေးပါတယ်။
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Request validation failed",
          result.error.issues,
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}