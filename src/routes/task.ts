import express from "express";
import { isAuthAdmin, isAuthUser } from "../middleware/auth";
import {
    createSubTaskController,
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
        const onlyMainTask = req.query.onlyMainTask;

        const tasks = await prisma.task.findMany({
            where: { userId, parentTaskId: null },
            include: { subTasks: true },
        });

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

router.post("/:parentTaskId/subtask", isAuthUser, createSubTaskController);

router.patch("/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const updatedTask = await prisma.task.update({
            where: { id },
            data: { status },
        });
        res.json({ data: updatedTask });
    } catch (error) {
        res.status(500).json({ error: "Error updating task status" });
    }
});

export default router;
