// server/src/runtime/crud.service.ts
import { prisma } from "../db";
import { toTableName } from "./schema.service";

// Sanitizes a column name to prevent SQL injection
function toColName(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

// GET all rows — supports basic filtering via query params
export async function getAllRows(
	entityName: string,
	configId: string,
	filters: Record<string, string> = {},
): Promise<unknown[]> {
	const tableName = toTableName(entityName);

	// Build WHERE clause from filters (only allow simple equality filters for now)
	const filterEntries = Object.entries(filters).filter(([key]) =>
		/^[a-z0-9_]+$/.test(key),
	);

	let whereClause = `WHERE "config_id" = '${configId}'`;
	filterEntries.forEach(([key, value]) => {
		whereClause += ` AND "${toColName(key)}" = '${value.replace(/'/g, "''")}'`;
	});

	const rows = await prisma.$queryRawUnsafe(
		`SELECT * FROM "${tableName}" ${whereClause} ORDER BY "created_at" DESC`,
	);

	return rows as unknown[];
}

// GET single row by id
export async function getRowById(
	entityName: string,
	id: string,
	configId: string,
): Promise<unknown | null> {
	const tableName = toTableName(entityName);

	const rows = (await prisma.$queryRawUnsafe(
		`SELECT * FROM "${tableName}" WHERE "id" = $1 AND "config_id" = $2`,
		id,
		configId,
	)) as unknown[];

	return rows[0] ?? null;
}

// POST — insert a new row
export async function createRow(
	entityName: string,
	configId: string,
	data: Record<string, unknown>,
): Promise<unknown> {
	const tableName = toTableName(entityName);

	const safeData = sanitizeData(data);

	// Separate column names and values for parameterized query
	const columns = Object.keys(safeData);
	const values = Object.values(safeData);

	// Build the parameterized placeholders: $1, $2, $3 ...
	const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
	const columnList = columns.map((c) => `"${c}"`).join(", ");

	const sql = `
    INSERT INTO "${tableName}" ("id", "config_id", ${columnList}, "created_at", "updated_at")
    VALUES (gen_random_uuid()::TEXT, '${configId}', ${placeholders}, NOW(), NOW())
    RETURNING *
  `;

	const rows = (await prisma.$queryRawUnsafe(sql, ...values)) as unknown[];
	return rows[0];
}

// PUT — update an existing row by id
export async function updateRow(
	entityName: string,
	id: string,
	configId: string,
	data: Record<string, unknown>,
): Promise<unknown> {
	const tableName = toTableName(entityName);
	const safeData = sanitizeData(data);

	const setClauses = Object.keys(safeData)
		.map((col, i) => `"${col}" = $${i + 1}`)
		.join(", ");

	const values = Object.values(safeData);

	const sql = `
    UPDATE "${tableName}"
    SET ${setClauses}, "updated_at" = NOW()
    WHERE "id" = $${values.length + 1} AND "config_id" = $${values.length + 2}
    RETURNING *
  `;

	const rows = (await prisma.$queryRawUnsafe(
		sql,
		...values,
		id,
		configId,
	)) as unknown[];
	return rows[0] ?? null;
}

// DELETE — remove a row by id
export async function deleteRow(
	entityName: string,
	id: string,
	configId: string,
): Promise<boolean> {
	const tableName = toTableName(entityName);

	await prisma.$executeRawUnsafe(
		`DELETE FROM "${tableName}" WHERE "id" = $1 AND "config_id" = $2`,
		id,
		configId,
	);

	return true;
}

// Strips any keys that could be dangerous (id, config_id, timestamps)
// and sanitizes column names. Users should not be able to overwrite these.
function sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
	const forbidden = new Set(["id", "config_id", "created_at", "updated_at"]);

	return Object.fromEntries(
		Object.entries(data)
			.filter(([key]) => !forbidden.has(key.toLowerCase()))
			.map(([key, value]) => [toColName(key), value]),
	);
}
