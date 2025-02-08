import express, { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client";
import bcrypt from "bcrypt";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const JWT_SECRET = process.env.SESSION_JWT_SECRET as string;

const router = express.Router();
const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
const saltRounds = 10;

router.post("/sign-in", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Need to pass email and password!" });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "User not exist." });
        }

        const isPasswordValid = await bcrypt.compare(password, user!.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Not valid password!" });
        }

        delete user.password;
        const accessToken = jwt.sign({ userId: user.id, email }, JWT_SECRET, {
            expiresIn: "1h",
        });

        return res.status(200).json({
            message: "Successfully Signed In!",
            data: { user, accessToken },
        });
    } catch (err) {
        return res.status(400).json({ error: err });
    }
});

router.post("/google", async (req: Request, res: Response) => {
    const { idToken } = req.body;

    if (!idToken)
        return res.status(400).json({ error: "Need to send idToken" });

    try {
        const ticket = await oAuth2Client.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const { email, name, picture } = payload;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            user = await prisma.user.create({
                data: { email, name, imageUrl: picture },
            });

        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" },
        );

        const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
            expiresIn: "7d",
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });

        res.status(200)
            .cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: false,
            })
            .cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: false,
                path: "/auth/refresh",
            })
            .json({
                message: "Authentication successful",
                data: { user, accessToken },
            });
    } catch (err) {
        console.error("Error during Google Authentication:", err);
        res.status(400).json({ error: "Authentication failed", details: err });
    }
});

router.post("/refresh", async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
        return res.status(401).json({ error: "Not authenticated" });

    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
            userId: string;
        };
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || user.refreshToken !== refreshToken) {
            return res.json(403).json({ error: "Invalid refresh token" });
        }

        const newAccessToken = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" },
        );

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: false,
        });

        return res.json({ message: "Token refreshed" });
    } catch {
        res.status(403).json({ error: "Invalid refresh token" });
    }
});

router.post("/sign-up", async (req: Request, res: Response) => {
    const { email, name, password } = req.body;

    try {
        if (!email || !password || !name) {
            return res
                .status(400)
                .json({ error: "You need to fill all fields!" });
        }

        const user = prisma.user.findUnique({
            where: { email },
        });
        if (user) {
            res.status(400).json({ error: "Email already in use!" });
        }

        const hashedPassword = bcrypt.hash(password, saltRounds);
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: "user",
            },
        });

        delete newUser.password;
        return res.status(201).json({
            message: "User Created!",
            user: {
                user: newUser,
            },
        });
    } catch (error) {
        res.status(500).json({ error });
    }
});

router.post("/logout", async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
        return res.status(401).json({ error: "Not authenticated" });

    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
            userId: string;
        };

        await prisma.user.update({
            where: { id: decoded.userId },
            data: { refreshToken: null },
        });

        res.clearCookie("token");
        res.clearCookie("refreshToken");

        res.json({ message: "Logged out successfully" });
    } catch {
        res.status(403).json({ error: "Invalid refresh token" });
    }
});

export default router;
