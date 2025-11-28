import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

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
	database: url.pathname.slice(1), // remove leading /
});

const prisma = new PrismaClient({ adapter });

export default prisma;
