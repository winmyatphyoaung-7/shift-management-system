import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

const port = Number(process.env["PORT"] ?? 3000);
const clientOrigin =
  process.env["CLIENT_ORIGIN"] ?? "http://localhost:5173";

app.disable("x-powered-by");

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Shift Management API is running",
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});