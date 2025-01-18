import { Request, Response } from "express";
import { createTask, updateTask, deleteTask } from "../services/task.service";

export const createTaskController = async (req: Request, res: Response) => {
    const { title, description } = req.body;
    const userId = req.userId;

    try {
        const newTask = await createTask({ title, description, userId });
        res.status(201).json({
            message: "Task created successfully",
            data: newTask,
        });
    } catch (error) {
        res.status(500).json({ error: "Error creating task" });
    }
};

export const updateTaskController = async (req: Request, res: Response) => {
    const { id: taskId } = req.params;
    const updateTaskData = req.body;

    try {
        const updatedTask = await updateTask(taskId, updateTaskData);
        res.status(200).json({
            message: "Task updated successfully",
            data: updatedTask,
        });
    } catch (error) {
        res.status(500).json({ error: "Error updating task" });
    }
};

export const deleteTaskController = async (req: Request, res: Response) => {
    const { id: taskId } = req.params;

    try {
        await deleteTask(taskId);
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error deleting task" });
    }
};
