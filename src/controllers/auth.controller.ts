import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client";
import bcrypt from "bcrypt";
import { User } from "@prisma/client";

const JWT_SECRET = process.env.SESSION_JWT_SECRET as string;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;

const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
const saltRounds = 10;

export const authSignInController = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            res.status(400).json({ error: "Need to pass email and password!" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: "User not exist." });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user!.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Not valid password!" });
            return;
        }

        const accessToken = jwt.sign({ userId: user.id, email }, JWT_SECRET, {
            expiresIn: "1h",
        });

        const { password: userPassword, ...userWithoutPassword } = user;
        res.status(200).json({
            message: "Successfully Signed In!",
            data: { user: userWithoutPassword, accessToken },
        });
    } catch (err) {
        res.status(400).json({ error: err });
    }
};

export const authGoogleSignInController = async (
    req: Request,
    res: Response,
) => {
    const { idToken } = req.body;

    if (!idToken) res.status(400).json({ error: "Need to send idToken" });

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
};

export const authRefreshTokenController = async (
    req: Request,
    res: Response,
) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) res.status(401).json({ error: "Not authenticated" });

    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
            userId: string;
        };
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || user.refreshToken !== refreshToken) {
            res.json(403).json({ error: "Invalid refresh token" });
            return;
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

        res.json({
            message: "Token refreshed",
            data: { accessToken: newAccessToken },
        });
    } catch {
        res.status(403).json({ error: "Invalid refresh token" });
    }
};

export const authSignUpController = async (req: Request, res: Response) => {
    const { email, name, password } = req.body;

    try {
        if (!email || !password || !name) {
            res.status(400).json({ error: "You need to fill all fields!" });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (user) {
            res.status(400).json({ error: "Email already in use!" });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: "user",
            },
        });

        const { password: userPassword, ...userWithoutPassword } = newUser;
        res.status(201).json({
            message: "User Created!",
            user: {
                user: userWithoutPassword,
            },
        });
    } catch (error) {
        res.status(500).json({ error });
    }
};

export const authSignOutController = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) res.status(401).json({ error: "Not authenticated" });

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
};
