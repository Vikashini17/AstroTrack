import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const createToken = (user: { _id: unknown; name: string; email: string; role: "user" | "admin" }) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign(
    { userId: String(user._id), name: user.name, email: user.email, role: user.role },
    secret,
    { expiresIn: "8h" }
  );
};

// Public registration always creates a regular user. Admins are provisioned from environment settings.
router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: "user" });
    const token = createToken(user);
    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const requestedRole = req.body.role === "admin" ? "admin" : "user";

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || user.role !== requestedRole || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email, password, or account type." });
    }

    return res.json({
      success: true,
      message: "Signed in successfully.",
      token: createToken(user),
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Could not sign in." });
  }
});

router.get("/me", authenticateToken, async (req, res) => {
  const authReq = req as AuthRequest;
  const user = authReq.user;
  if (!user) return res.status(401).json({ success: false, message: "Please sign in again." });
  return res.json({ success: true, user: { id: user.userId, name: user.name, email: user.email, role: user.role } });
});

export default router;
