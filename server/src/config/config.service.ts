// server/src/config/config.service.ts
import { prisma } from "../db";
import { normalizeConfig } from "../../../shared/src/normalizer";
import { AppConfig, NormalizeResult } from "../../../shared/src/types";
import { ensureAllTables } from "../runtime/schema.service";

export async function saveConfig(
	rawConfig: unknown,
): Promise<{ id: string; result: NormalizeResult }> {
	const result = normalizeConfig(rawConfig);
	const { config } = result;

	const saved = await prisma.config.create({
		data: {
			name: config.appName,
			config: JSON.stringify(config), // store the normalized version
		},
	});

	// Immediately create the tables for this config
	await ensureAllTables(config.entities);

	return { id: saved.id, result };
}

export async function loadConfig(
	id: string,
): Promise<{ id: string; config: AppConfig } | null> {
	const record = await prisma.config.findUnique({ where: { id } });
	if (!record) return null;

	// Always pass through normalizeConfig even when reading from DB —
	// this protects against schema changes between the time of save and load
	const { config } = normalizeConfig(JSON.parse(record.config));
	return { id: record.id, config };
}

export async function listConfigs() {
	return prisma.config.findMany({
		select: { id: true, name: true, createdAt: true, updatedAt: true },
		orderBy: { createdAt: "desc" },
	});
}
