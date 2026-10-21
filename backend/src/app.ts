import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import astroRoutes from "./routes/astroRoutes";
import observationRoutes from "./routes/observationRoutes";
import authRoutes from "./routes/authRoutes";
import adminRoutes from "./routes/adminRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "AstroTrack MERN API is running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/astro", astroRoutes);
app.use("/api/observations", observationRoutes);
app.use("/api/admin", adminRoutes);

export default app;
