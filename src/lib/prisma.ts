import "dotenv/config";
import { PrismaClient } from "../../prisma/generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaMariaDb(connectionString);

const prisma = new PrismaClient({ adapter });

export default prisma;
