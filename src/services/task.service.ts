import prisma from "../../prisma/client";

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

export const createTask = async (data: {
    title: string;
    description: string;
    userId: string;
}) => {
    return prisma.task.create({
        data,
    });
};

export const updateTask = async (
    taskId: string,
    data: { title: string; description: string },
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
