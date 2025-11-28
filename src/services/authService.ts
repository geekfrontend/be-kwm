import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userService from "./userService";
import prisma from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const login = async (email: string, password: string) => {
	const user = await userService.getUserByEmail(email);

	if (!user) {
		throw new Error("Invalid email or password");
	}

	if (!user.isActive) {
		const err = new Error("Account disabled") as Error & { status?: number };
		err.status = 403;
		throw err;
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);

	if (!isPasswordValid) {
		throw new Error("Invalid email or password");
	}

	const token = jwt.sign(
		{ userId: user.id, email: user.email, role: user.role },
		JWT_SECRET,
		{ expiresIn: "1d" },
	);

	// Save token to database (optional, but good for logout/invalidation if needed, user has `token` field)
	await prisma.user.update({
		where: { id: user.id },
		data: { token },
	});

	// Return user without password
	const { password: _, ...userWithoutPassword } = user;

	return { user: userWithoutPassword, token };
};

export const logout = async (userId: string) => {
	// Invalidate token in db
	await prisma.user.update({
		where: { id: userId },
		data: { token: null },
	});
};

export const getMe = async (userId: string) => {
	const user = await userService.getUserById(userId);
	if (!user) throw new Error("User not found");
	// getUserById already excludes password via select, so just return user
	return user;
};
