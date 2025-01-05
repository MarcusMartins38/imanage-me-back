import { Request, Response } from "express";
import prisma from "../../prisma/client";
import { uploadImageToGCS } from "../services/user.service";

type CreateUserRequest = Request & {
    body: {
        name?: string;
        email?: string;
    };
    file?: Express.Multer.File;
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
