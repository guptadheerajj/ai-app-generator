// server/src/runtime/schema.service.ts
import { prisma } from "../db";
import { EntityConfig, FieldConfig } from "../../../shared/src/types";

// Maps your config field types to PostgreSQL column types
function toPostgresType(fieldType: FieldConfig["type"]): string {
	const typeMap: Record<string, string> = {
		string: "TEXT",
		email: "TEXT",
		number: "NUMERIC",
		boolean: "BOOLEAN",
		date: "TIMESTAMP",
		select: "TEXT",
	};
	return typeMap[fieldType] ?? "TEXT"; // unknown types default to TEXT
}

// Sanitizes entity name to be safe as a table name.
// "My Entity!" becomes "my_entity" — prevents SQL injection via table names.
export function toTableName(entityName: string): string {
	return entityName
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]/g, "_"); // replace anything that's not alphanumeric with underscore
}

// Creates or updates a table for the given entity.
// Uses IF NOT EXISTS so running this twice is safe.
export async function ensureTable(entity: EntityConfig): Promise<void> {
	const tableName = toTableName(entity.name);

	// Build the column definitions from the entity's fields
	const columnDefs = entity.fields
		.map((field) => {
			const colName = field.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
			const colType = toPostgresType(field.type);
			const notNull = field.required ? "NOT NULL" : "";
			return `"${colName}" ${colType} ${notNull}`.trim();
		})
		.join(",\n  ");

	// Every dynamic table gets an id, timestamps, and a config_id to know
	// which app config this data belongs to (important for user-scoped data)
	const sql = `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
      "config_id" TEXT NOT NULL,
      ${columnDefs ? columnDefs + "," : ""}
      "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("id")
    );
  `;

	await prisma.$executeRawUnsafe(sql);
	console.log(`✓ Table ensured: ${tableName}`);
}

// Call this when loading a config — ensures all entity tables exist
export async function ensureAllTables(entities: EntityConfig[]): Promise<void> {
	// Run all table creations in parallel for speed
	await Promise.all(entities.map((entity) => ensureTable(entity)));
}
