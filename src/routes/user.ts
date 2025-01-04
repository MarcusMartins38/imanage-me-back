import { Storage } from "@google-cloud/storage";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { isAuthAdmin, isAuthUser } from "../middleware/auth";
import upload from "../middleware/upload";

const router = express.Router();
const prisma = new PrismaClient();
const saltRounds = 10;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = new Storage({
    keyFilename: path.join(__dirname, process.env.GCLOUD_CREDENTIALS_PATH), // Caminho do arquivo de credenciais
    projectId: process.env.GCLOUD_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME);

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

const uploadImageToGCS = (file: Express.Multer.File) => {
    return new Promise((resolve, reject) => {
        const blob = bucket.file(Date.now() + "-" + file.originalname);
        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        blobStream.on("error", (err) => reject(err));

        blobStream.on("finish", () => {
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(imageUrl);
        });

        blobStream.end(file.buffer);
    });
};

router.put(
    "/profile",
    [isAuthUser, upload.single("profileImageFile")],
    async (req: Request, res: Response) => {
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
    },
);

export default router;
