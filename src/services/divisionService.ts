import prisma from "../lib/prisma";

const select = {
	id: true,
	name: true,
	isActive: true,
	createdAt: true,
	updatedAt: true,
};

export const createDivision = async (data: {
	name: string;
	isActive?: boolean;
}) => {
	const division = await prisma.division.create({
		data: { name: data.name, isActive: data.isActive ?? true },
		select,
	});
	return division;
};

export const getDivisions = async (page: number, pageSize: number) => {
	const skip = (page - 1) * pageSize;
	const [items, totalItems] = await Promise.all([
		prisma.division.findMany({
			skip,
			take: pageSize,
			orderBy: { name: "asc" },
			select,
		}),
		prisma.division.count(),
	]);
	return { items, totalItems };
};

export const getDivisionById = async (id: string) => {
	const division = await prisma.division.findUnique({ where: { id }, select });
	return division;
};

export const updateDivision = async (
	id: string,
	data: { name?: string; isActive?: boolean },
) => {
	const division = await prisma.division.update({
		where: { id },
		data,
		select,
	});
	return division;
};

export const deleteDivision = async (id: string) => {
	await prisma.division.delete({ where: { id } });
};
