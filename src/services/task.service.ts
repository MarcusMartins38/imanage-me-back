import prisma from "../../prisma/client";
import { TaskT } from "../utils/types";

export const findTasksByUser = async (userId: string) => {
    return prisma.task.findMany({
        where: { userId },
    });
};

export const findTaskById = async (taskId: string) => {
    return prisma.task.findFirstOrThrow({
        where: { id: taskId },
    });
};

export const createTask = async (data: Omit<TaskT, "id">) => {
    return prisma.task.create({
        data: {
            title: data.title,
            description: data.description,
            priority: Number(data.priority || 1),
            category: data.category,
            user: {
                connect: { id: "f2ef2416-3506-412c-8939-e681cb89ef3e" },
            },
            subTasks: {
                create: data.subTasks?.map((subTask) => ({
                    title: subTask.title,
                    priority: 1,
                    user: {
                        connect: { id: "f2ef2416-3506-412c-8939-e681cb89ef3e" },
                    },
                })),
            },
        },
    });
};

export const updateTask = async (
    taskId: string,
    data: Omit<TaskT, "id" | "userId">,
) => {
    return prisma.task.update({
        where: { id: taskId },
        data,
    });
};

export const deleteTask = async (taskId: string) => {
    return prisma.task.delete({
        where: { id: taskId },
    });
};
