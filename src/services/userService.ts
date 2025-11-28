import prisma from "../lib/prisma";
import type { Prisma } from "../../prisma/generated/client/client";
import bcrypt from "bcryptjs";

const userSelect = {
	id: true,
	name: true,
	email: true,
	role: true,
	isActive: true,
	createdAt: true,
	updatedAt: true,
};

export const createUser = async (data: Prisma.UserCreateInput) => {
	const hashedPassword = await bcrypt.hash(data.password, 10);
	return await prisma.user.create({
		data: {
			...data,
			role: data.role ?? "EMPLOYEE",
			password: hashedPassword,
		},
		select: userSelect,
	});
};

export const getUsers = async () => {
	return await prisma.user.findMany({
		select: userSelect,
	});
};

export const getUserById = async (id: string) => {
	return await prisma.user.findUnique({
		where: { id },
		select: userSelect,
	});
};

export const getUserByEmail = async (email: string) => {
	return await prisma.user.findUnique({
		where: { email },
		// Need password for login check, so we don't use userSelect here usually,
		// but this function might be used for other things.
		// For login, we need the password.
		// Let's create a specific function for login if needed, or just return everything here and handle it in authService.
		// authService calls this. So we must return password.
	});
};

export const updateUser = async (id: string, data: Prisma.UserUpdateInput) => {
	if (typeof data.password === "string") {
		data.password = await bcrypt.hash(data.password, 10);
	} else if (
		data.password &&
		"set" in data.password &&
		typeof data.password.set === "string"
	) {
		data.password = { set: await bcrypt.hash(data.password.set, 10) };
	}
	return await prisma.user.update({
		where: { id },
		data,
		select: userSelect,
	});
};

export const deleteUser = async (id: string) => {
	return await prisma.user.delete({
		where: { id },
		select: userSelect,
	});
};
