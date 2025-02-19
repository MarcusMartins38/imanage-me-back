import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import { updateUser } from "../controllers/user.controller";
import { isAuthAdmin, isAuthUser } from "../middleware/auth.middleware";
import upload from "../middleware/upload.middleware";

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

router.put(
    "/profile",
    [isAuthUser, upload.single("profileImageFile")],
    updateUser,
);

export default router;
