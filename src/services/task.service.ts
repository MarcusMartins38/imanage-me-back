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
            priority: Number(data.priority),
            category: data.category,
            user: {
                connect: { id: data.userId },
            },
            subTasks: {
                create: data.subTasks?.map((subTask) => ({
                    title: subTask.title,
                    priority: 1,
                    user: {
                        connect: { id: data.userId },
                    },
                })),
            },
        },
        include: {
            subTasks: true,
        },
    });
};

export const updateTask = async (
    taskId: string,
    data: Omit<TaskT, "id" | "userId">,
) => {
    return await prisma.$transaction(async (prisma) => {
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: data.title,
                description: data.description,
                priority: Number(data.priority || 1),
                category: data.category,
                user: { connect: { id: data.userId } },
            },
            include: {
                subTasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
            },
        });

        const newSubTasks = data.subTasks
            ?.filter((subTask) => !subTask.id)
            .map((subTask) => ({
                title: subTask.title,
                priority: subTask.priority || 1,
                userId: data.userId,
                parentTaskId: taskId,
            }));

        let createdSubTasks = [];
        if (newSubTasks?.length) {
            createdSubTasks = await Promise.all(
                newSubTasks.map(async (subTaskData) => {
                    return await prisma.task.create({
                        data: subTaskData,
                    });
                }),
            );
        }

        const updateSubTasks = data.subTasks?.filter((subTask) => subTask.id);
        if (updateSubTasks?.length) {
            for (const subTask of updateSubTasks) {
                await prisma.task.update({
                    where: { id: subTask.id },
                    data: {
                        title: subTask.title,
                        priority: subTask.priority || 1,
                    },
                });
            }
        }

        return {
            ...updatedTask,
            subTasks: [...updatedTask.subTasks, ...createdSubTasks],
        };
    });
};

export const deleteTask = async (taskId: string) => {
    return prisma.task.delete({
        where: { id: taskId },
    });
};
