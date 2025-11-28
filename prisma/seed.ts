import "dotenv/config";
import { PrismaClient, Prisma } from "./generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL is not defined");
}

const url = new URL(connectionString);

const adapter = new PrismaMariaDb({
	host: url.hostname,
	port: Number(url.port) || 3306,
	user: url.username,
	password: url.password,
	database: url.pathname.slice(1),
});

const prisma = new PrismaClient({ adapter });

async function main() {
	console.log(`Start seeding ...`);

	// await prisma.user.deleteMany();

	const hashedPassword = await bcrypt.hash("password123", 10);

	const userData: Prisma.UserCreateInput[] = [
		{
			name: "Alice",
			email: "alice@prisma.io",
			password: hashedPassword,
			role: "ADMIN",
		},
		{
			name: "Nilu",
			email: "nilu@prisma.io",
			password: hashedPassword,
			role: "EMPLOYEE",
		},
		{
			name: "Mahmoud",
			email: "mahmoud@prisma.io",
			password: hashedPassword,
			role: "SECURITY",
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
