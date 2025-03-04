import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
    userId?: string;
}

export const isAuthAdmin = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "There is no oAuth Token." });
            return;
        }

        const decoded = jwt.verify(
            token,
            process.env.SESSION_JWT_SECRET as string,
        );
        const { role } = decoded as { role: string };

        if (role !== "admin") {
            res.status(403).json({ error: "Not allowed to access this!" });
            return;
        }

        next();
    } catch (err) {
        res.status(401).json({ error: "Token expired." });
        return;
    }
};

export const isAuthUser = (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void => {
    try {
        const accessToken = req.cookies.accessToken;
        const token = req.headers.authorization?.split(" ")[1];

        if (!accessToken) {
            res.status(403).json({ error: "There is no oAuth Token." });
            return;
        }

        const decoded = jwt.verify(
            accessToken,
            process.env.SESSION_JWT_SECRET!,
        ) as JwtPayload;

        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: "Token expired or invalid." });
    }
};
