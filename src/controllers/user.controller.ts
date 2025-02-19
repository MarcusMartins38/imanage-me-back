import { Response } from "express";
import prisma from "../../prisma/client";
import { uploadImageToGCS } from "../services/user.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email } = req.body;
        const userId = req.userId;

        let imageUrl = "";

        if (req.file) {
            imageUrl = (await uploadImageToGCS(req.file)) as string;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                imageUrl: imageUrl || null,
            },
        });

        res.status(200).json({
            message: "Profile Updated Successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erro when tried to update your profile",
            error,
        });
    }
};
