import { Router } from "express";
import mongoose from "mongoose";
import Observation from "../models/Observation";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticateToken);

// Users can create observations for their own account; observer identity comes from the signed-in user.
router.post("/", async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const { object, date, notes } = req.body;
    if (!object || !date) {
      return res.status(400).json({ success: false, message: "Object and date are required." });
    }
    const observation = await Observation.create({
      object: String(object).trim(),
      observer: user.name,
      date: String(date),
      notes: String(notes || "").trim(),
      userId: new mongoose.Types.ObjectId(user.userId),
    });
    return res.status(201).json({ success: true, message: "Observation added successfully.", data: observation });
  } catch (error) {
    console.error("Create observation error:", error);
    return res.status(500).json({ success: false, message: "Failed to add observation." });
  }
});

// Admins can view all observations. Users can only view their own.
router.get("/", async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const filter = authReq.user!.role === "admin" ? {} : { userId: authReq.user!.userId };
    const observations = await Observation.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: observations.length, data: observations });
  } catch (error) {
    console.error("Fetch observations error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch observations." });
  }
});

// Admins may delete any observation; users may delete only their own.
router.delete("/:id", async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid observation ID." });
    }
    const filter: Record<string, unknown> = { _id: req.params.id };
    if (authReq.user!.role !== "admin") filter.userId = authReq.user!.userId;
    const deleted = await Observation.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Observation not found or you do not have permission to delete it." });
    }
    return res.json({ success: true, message: "Observation deleted successfully." });
  } catch (error) {
    console.error("Delete observation error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete observation." });
  }
});

export default router;
