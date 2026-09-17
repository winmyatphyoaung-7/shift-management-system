import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth-routes.js";
import { memberRouter } from "./routes/member-routes.js";
import { scheduleRouter } from "./routes/schedule-routes.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";


export const app = express();

const clientOrigin =
  process.env["CLIENT_ORIGIN"] ?? "http://localhost:5173";

app.disable("x-powered-by");

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Shift Management API is running",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/members", memberRouter);
app.use("/api/v1/schedule-days",scheduleRouter,);

// Routes အားလုံးရဲ့နောက်မှာထားရမယ်
app.use(notFoundHandler);

// Error handler ကိုနောက်ဆုံးမှာထားရမယ်
app.use(errorHandler);