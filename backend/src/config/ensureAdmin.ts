import bcrypt from "bcryptjs";
import User from "../models/User";

/** Creates the initial admin account once. Admin credentials are read only from backend environment variables. */
const ensureAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "AstroTrack Admin";

  if (!email || !password) {
    console.warn("ADMIN_EMAIL/ADMIN_PASSWORD not set; admin sign-in is not provisioned yet.");
    return;
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      throw new Error("ADMIN_EMAIL already belongs to a regular user. Choose a different ADMIN_EMAIL or promote the account manually after verifying ownership.");
    }
    return;
  }

  await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: "admin" });
  console.log(`Initial AstroTrack admin account provisioned for ${email}`);
};

export default ensureAdmin;
