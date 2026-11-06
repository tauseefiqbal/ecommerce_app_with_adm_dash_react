import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { CustomJwtSessionClaims } from "@repo/types";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const isClerkConfigured = () =>
  process.env.CLERK_PUBLISHABLE_KEY &&
  !process.env.CLERK_PUBLISHABLE_KEY.includes("your_clerk") &&
  process.env.CLERK_PUBLISHABLE_KEY.length > 30;

export const shouldBeUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isClerkConfigured()) {
    req.userId = "dev_user_123";
    return next();
  }

  try {
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({ message: "You are not logged in!" });
    }

    req.userId = auth.userId;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed!" });
  }
};

export const shouldBeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isClerkConfigured()) {
    req.userId = "dev_admin_123";
    return next();
  }

  try {
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({ message: "You are not logged in!" });
    }

    const claims = auth.sessionClaims as CustomJwtSessionClaims;

    if (claims?.metadata?.role !== "admin") {
      return res.status(403).send({ message: "Unauthorized!" });
    }

    req.userId = auth.userId;
    return next();
  } catch (error) {
    return res.status(403).json({ message: "Unauthorized!" });
  }
};
