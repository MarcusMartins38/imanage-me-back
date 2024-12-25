import { PrismaClient } from "@prisma/client";
import express from "express";
import { isAuthAdmin, isAuthUser } from "../middleware/auth";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/all", isAuthAdmin, async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.task.findMany();
        res.status(200).json({ data: tasks });
    } catch (error) {
        res.status(500).json({ error: "Error can't get tasks." });
        return;
    }
});

router.get("/", isAuthUser, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const tasks = await prisma.task.findMany({ where: { userId } });

        res.status(200).json({ data: tasks });
    } catch (error) {
        res.status(500).json({ error: "Error can't get tasks." });
        return;
    }
});

router.post("/", isAuthUser, async (req: Request, res: Response) => {
    const { title, description } = req.body;
    const userId = req.userId;

    try {
        const newTask = await prisma.task.create({
            data: {
                title,
                description,
                userId,
            },
        });

        res.status(201).json({ data: newTask });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

router.delete("/:id", isAuthUser, async (req: Request, res: Response) => {
    const userId = req.userId;
    const { id: taskId } = req.params;

    try {
        const task = await prisma.task.findFirstOrThrow({
            where: { id: taskId },
        });

        if (task.userId !== userId)
            res.status(401).json({
                error: "You are not the owner of this task",
            });

        await prisma.task.delete({
            where: { id: task.id },
        });

        res.status(200).json({ message: "Task deleted successfully" });
        return;
    } catch (err) {
        res.status(500).json({ error: err });
        return;
    }
});

export default router;
