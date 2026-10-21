import dotenv from "dotenv";
import app from "./app";
import connectDB from "./config/db";
import ensureAdmin from "./config/ensureAdmin";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    await ensureAdmin();

    app.listen(PORT, () => {
      console.log(`AstroTrack backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start AstroTrack backend:", error);
    process.exit(1);
  }
};

startServer();
