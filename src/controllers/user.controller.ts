import { Request, Response } from "express";
import prisma from "../../prisma/client";
import { uploadImageToGCS } from "../services/user.service";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";

type CreateUserRequest = Request & {
    body: {
        name?: string;
        email?: string;
    };
    file?: Express.Multer.File;
};

const saltRounds = 10;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const JWT_SECRET = process.env.SESSION_JWT_SECRET as string;
const oauthClient = new OAuth2Client(CLIENT_ID);

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: "Token is required" });
        }

        const ticket = await oauthClient.verifyIdToken({
            idToken,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(401).json({ error: "Invalid Google Token" });
        }

        const { email, name, picture } = payload;

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: { email, name, imageUrl: picture },
            });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "4h",
        });

        res.json({
            message: "Login successful",
            data: { user, accessToken: token },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const signIn = async (req: Request, res: Response) => {
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
        const session = jwt.sign({ ...user }, JWT_SECRET, {
            expiresIn: process.env.SESSION_JWT_EXPIRATION || "4h",
            audience: "imanage-me-app",
            issuer: "imanage-me-app",
        });

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
};

export const signUp = async (req: Request, res: Response) => {
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
};

export const updateUser = async (req: CreateUserRequest, res: Response) => {
    try {
        const { name, email } = req.body;
        const userId = req.userId;

        let imageUrl = "";

        if (req.file) {
            imageUrl = await uploadImageToGCS(req.file);
        }

        // Atualizando usuário no banco de dados
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                imageUrl: imageUrl || null, // Se não houver imagem, mantemos o valor como null
            },
        });

        return res.status(200).json({
            message: "Perfil atualizado com sucesso",
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Erro ao atualizar perfil", error });
    }
};
