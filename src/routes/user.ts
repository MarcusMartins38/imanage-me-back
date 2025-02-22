import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import { updateUser } from "../controllers/user.controller";
import { isAuthAdmin, isAuthUser } from "../middleware/auth.middleware";
import upload from "../middleware/upload.middleware";
import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/all", isAuthAdmin, async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json({ users });
        return;
    } catch (err) {
        res.status(500).json({ error: "Error can't get users." });
        return;
    }
});

router.get("/me", (req, res) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
        res.status(401).json({ message: "Unauthorized" });
    }

    jwt.verify(
        accessToken,
        process.env.SESSION_JWT_SECRET as string,
        (err, user) => {
            if (err) {
                res.status(403).json({ message: "Token expired" });
            }

            res.json({
                name: user.name,
                email: user.email,
                imageUrl: user.imageUrl,
            });
        },
    );
});

router.put(
    "/profile",
    [isAuthUser, upload.single("profileImageFile")],
    updateUser,
);

export default router;
