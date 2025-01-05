import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { updateUser } from "../controllers/user.controller";
import { isAuthAdmin, isAuthUser } from "../middleware/auth";
import upload from "../middleware/upload";

const router = express.Router();
const prisma = new PrismaClient();
const saltRounds = 10;

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

router.post("/sign-up", async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            res.status(400).json({
                error: "Todos os campos são obrigatórios.",
            });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(400).json({ error: "Email já está em uso." });
            return;
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

        res.status(201).json({
            message: "Usuário criado com sucesso.",
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            },
        });
        return;
    } catch (error) {
        res.status(500).json({ error: "Erro interno do servidor." });
        return;
    }
});

router.post("/sign-in", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "Email e senha são obrigatórios." });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: "Can't find user." });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Credenciais inválidas." });
            return;
        }

        delete user.password;
        const session = jwt.sign(
            { ...user },
            process.env.SESSION_JWT_SECRET as string,
            {
                expiresIn: process.env.SESSION_JWT_EXPIRATION || "4h",
                audience: "imanage-me-app",
                issuer: "imanage-me-app",
            },
        );

        res.status(200).json({
            message: "Successfully Signed In.",
            data: { user, accessToken: session },
        });
        return;
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server Error." });
        return;
    }
});

router.put(
    "/profile",
    [isAuthUser, upload.single("profileImageFile")],
    updateUser,
);

export default router;
