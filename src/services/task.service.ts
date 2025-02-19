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

export const updateTask = async (taskId: string, data: Omit<TaskT, "id">) => {
    try {
        return await prisma.$transaction(async (tx) => {
            const updatedTask = await tx.task.update({
                where: { id: taskId },
                data: {
                    title: data.title,
                    description: data.description,
                    priority: Number(data.priority) || 1,
                    category: data.category,
                    user: data.userId
                        ? { connect: { id: data.userId } }
                        : undefined,
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

            const newSubTasks =
                data.subTasks?.filter((subTask) => !subTask.id) || [];
            let createdSubTasks = [] as Omit<TaskT, "userId">[];

            if (newSubTasks.length > 0) {
                createdSubTasks = await Promise.all(
                    newSubTasks.map((subTaskData) =>
                        tx.task.create({
                            data: {
                                title: subTaskData.title,
                                priority: Number(subTaskData.priority) || 1,
                                userId: data.userId,
                                parentTaskId: taskId,
                            },
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        }),
                    ),
                );
            }

            const updateSubTasks =
                data.subTasks?.filter((subTask) => subTask.id) || [];
            for (const subTask of updateSubTasks) {
                await tx.task.update({
                    where: { id: subTask.id },
                    data: {
                        title: subTask.title,
                        priority: Number(subTask.priority) || 1,
                    },
                });
            }

            return {
                ...updatedTask,
                subTasks: [...(updatedTask.subTasks || []), ...createdSubTasks],
            };
        });
    } catch (error) {
        console.error(error);
        throw new Error("Erro ao atualizar a tarefa. Verifique os logs.");
    }
};

export const deleteTask = async (taskId: string) => {
    return prisma.task.delete({
        where: { id: taskId },
    });
};
