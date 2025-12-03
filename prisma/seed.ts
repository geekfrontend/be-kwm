import "dotenv/config";
import { PrismaClient, Prisma } from "./generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

let adapter: PrismaMariaDb;
const host = process.env.DB_HOST;
const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;
if (host && user && database) {
	adapter = new PrismaMariaDb({
		connectionLimit: 10,
		host,
		port,
		user,
		password,
		database,
	});
} else {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL is not defined");
	}
	const url = new URL(connectionString);
	adapter = new PrismaMariaDb({
		connectionLimit: 10,
		host: url.hostname,
		port: Number(url.port) || 3306,
		user: url.username,
		password: url.password,
		database: url.pathname.slice(1),
	});
}

const prisma = new PrismaClient({ adapter });

async function main() {
	console.log(`Start seeding ...`);

	// await prisma.user.deleteMany();

	const hashedPassword = await bcrypt.hash("password123", 10);

	const divisionData: Prisma.DivisionCreateInput[] = [
		{ name: "Teknik", isActive: true },
		{ name: "Gudang", isActive: true },
		{ name: "Umum", isActive: true },
		{ name: "Accounting", isActive: true },
		{ name: "Marketing", isActive: true },
	];

	for (const d of divisionData) {
		const division = await prisma.division.upsert({
			where: { name: d.name },
			update: {},
			create: d,
		});
		console.log(`Upserted division: ${division.name}`);
	}

	const userData: Prisma.UserCreateInput[] = [
		{
			name: "Alice",
			email: "alice@prisma.io",
			password: hashedPassword,
			role: "ADMIN",
			division: { connect: { name: "Umum" } },
		},
		{
			name: "Nilu",
			email: "nilu@prisma.io",
			password: hashedPassword,
			role: "EMPLOYEE",
			division: { connect: { name: "Teknik" } },
		},
		{
			name: "Mahmoud",
			email: "mahmoud@prisma.io",
			password: hashedPassword,
			role: "SECURITY",
			division: { connect: { name: "Gudang" } },
		},
	];

	for (const u of userData) {
		// Upsert to avoid duplicates
		const user = await prisma.user.upsert({
			where: { email: u.email },
			update: {},
			create: u,
		});
		console.log(`Created user with id: ${user.id}`);
	}
	console.log(`Seeding finished.`);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
