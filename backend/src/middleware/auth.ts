import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const secret = process.env.JWT_SECRET;

  if (!token) {
    res.status(401).json({ success: false, message: "Please sign in to continue." });
    return;
  }
  if (!secret) {
    res.status(500).json({ success: false, message: "Authentication is not configured." });
    return;
  }

  try {
    (req as AuthRequest).user = jwt.verify(token, secret) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Your session has expired. Please sign in again." });
  }
};

export const requireRole = (...roles: Array<"user" | "admin">) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ success: false, message: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
