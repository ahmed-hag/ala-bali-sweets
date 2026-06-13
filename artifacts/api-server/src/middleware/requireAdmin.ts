import { type Request, type Response, type NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any).isAdmin) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}
