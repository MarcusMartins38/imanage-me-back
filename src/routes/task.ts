import express from "express";
import { isAuthAdmin, isAuthUser } from "../middleware/auth";
import {
    createTaskController,
    deleteTaskController,
    updateTaskController,
} from "../controllers/task.controller";
import prisma from "../../prisma/client";

const router = express.Router();

router.get("/all", isAuthAdmin, async (_: Request, res: Response) => {
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
        return;
    } catch (error) {
        res.status(500).json({ error: "Error can't get tasks." });
        return;
    }
});

router.post("/", isAuthUser, createTaskController);

router.patch("/:id", isAuthUser, updateTaskController);

router.delete("/:id", isAuthUser, deleteTaskController);

export default router;
