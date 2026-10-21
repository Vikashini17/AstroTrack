import { Router } from "express";
import Observation from "../models/Observation";
import User from "../models/User";
import { authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// All endpoints in this router are restricted to authenticated administrators.
router.use(authenticateToken, requireRole("admin"));

router.get("/analytics", async (_req, res) => {
  try {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const [totalUsers, totalObservations, observationsToday, topObjects, recentMonths] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Observation.countDocuments(),
      Observation.countDocuments({ date: todayString }),
      Observation.aggregate([
        { $group: { _id: { $toLower: "$object" }, count: { $sum: 1 }, label: { $first: "$object" } } },
        { $sort: { count: -1, label: 1 } },
        { $limit: 5 },
        { $project: { _id: 0, object: "$label", count: 1 } },
      ]),
      Observation.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } } },
        { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const monthLabels = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1, label: date.toLocaleString("en", { month: "short" }) };
    });
    const monthlyObservations = monthLabels.map((month) => ({
      label: `${month.label} ${String(month.year).slice(-2)}`,
      count: recentMonths.find((item) => item._id.year === month.year && item._id.month === month.month)?.count ?? 0,
    }));

    return res.json({
      success: true,
      data: { totalUsers, totalObservations, observationsToday, topObjects, monthlyObservations },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return res.status(500).json({ success: false, message: "Unable to load admin analytics." });
  }
});

export default router;
