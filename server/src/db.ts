// server/src/db.ts
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// In development, hot-reloading can create multiple Prisma instances.
// Storing it on globalThis prevents that problem.
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
	pool: Pool | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL is missing. Ensure server/.env is loaded.");
}

const pool =
	globalForPrisma.pool ||
	new Pool({
		connectionString: databaseUrl,
	});

const adapter = new PrismaPg(pool);

export const prisma =
	globalForPrisma.prisma ||
	new PrismaClient({
		adapter,
		log: ["query", "error", "warn"], // logs every SQL query in dev — very useful
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
	globalForPrisma.pool = pool;
}
