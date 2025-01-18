import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import {
    signIn,
    signUp,
    updateUser,
    googleLogin,
} from "../controllers/user.controller";
import { isAuthAdmin, isAuthUser } from "../middleware/auth";
import upload from "../middleware/upload";

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

router.post("/sign-up", signUp);

router.post("/sign-in", signIn);

router.post("/google-login", googleLogin);

router.put(
    "/profile",
    [isAuthUser, upload.single("profileImageFile")],
    updateUser,
);

export default router;
