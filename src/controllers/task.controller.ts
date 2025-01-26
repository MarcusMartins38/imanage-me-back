import { Request, Response } from "express";
import { createTask, updateTask, deleteTask } from "../services/task.service";

export const createTaskController = async (req: Request, res: Response) => {
    const createTaskData = req.body;
    const userId = req.userId;

    const formattedData = {
        ...createTaskData,
        priority: Number(createTaskData.priority || 1),
    };

    try {
        const newTask = await createTask({ ...formattedData, userId });
        res.status(201).json({
            message: "Task created successfully",
            data: newTask,
        });
    } catch (error) {
        res.status(500).json({ error });
    }
};

export const createSubTaskController = async (req: Request, res: Response) => {
    const { parentTaskId } = req.params;
    const taskData = req.body;
    const userId = req.userId;

    const formattedData = {
        ...taskData,
        priority: Number(taskData.priority || 1),
    };

    const newSubTask = createTask({ ...formattedData, userId, parentTaskId });

    res.status(201).json({
        message: "SubTask created successfully",
        data: newSubTask,
    });
};

export const updateTaskController = async (req: Request, res: Response) => {
    const { id: taskId } = req.params;
    let updateTaskData = req.body;
    const userId = req.userId;

    if (updateTaskData.priority) {
        updateTaskData = {
            ...updateTaskData,
            priority: Number(updateTaskData.priority),
        };
    }

    try {
        const updatedTask = await updateTask(taskId, {
            ...updateTaskData,
            userId,
        });

        res.status(200).json({
            message: "Task updated successfully",
            data: updatedTask,
        });
    } catch (error) {
        res.status(500).json({ error });
    }
};

export const deleteTaskController = async (req: Request, res: Response) => {
    const { id: taskId } = req.params;

    try {
        await deleteTask(taskId);
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ error });
    }
};
