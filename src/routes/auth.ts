import express, { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const JWT_SECRET = process.env.SESSION_JWT_SECRET as string;

const router = express.Router();
const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

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

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" },
        );

        res.status(200)
            .cookie("token", token, {
                httpOnly: true,
                secure: false,
                maxAge: 3600000,
            })
            .json({ message: "Authentication successful", user });
    } catch (err) {
        console.error("Error during Google Authentication:", err);
        res.status(400).json({ error: "Authentication failed", details: err });
    }
});

export default router;
