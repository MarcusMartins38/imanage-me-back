import { PrismaClient } from "@prisma/client";
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";

const router = express.Router();
const prisma = new PrismaClient();
const saltRounds = 10;

router.post("/sign-up", async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res
                .status(400)
                .json({ error: "Todos os campos são obrigatórios." });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ error: "Email já está em uso." });
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

        return res.status(201).json({
            message: "Usuário criado com sucesso.",
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro interno do servidor." });
    }
});

router.post("/login", async (req: Request, res: Response) => {});

export default router;
