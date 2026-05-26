// src/config/normalizer.ts

import {
	AppConfig,
	EntityConfig,
	FieldConfig,
	PageConfig,
	WidgetConfig,
	NormalizeResult,
} from "./types";
import {
	VALID_FIELD_TYPES,
	VALID_PAGE_TYPES,
	DEFAULT_FIELD_TYPE,
	UNKNOWN_PAGE_TYPE,
} from "./constants";

// ─── Field Normalizer ────────────────────────────────────────────────────────
// Takes one raw field (could be null, missing properties, invalid type) and
// returns a valid FieldConfig, or null if the field is too broken to save.

function normalizeField(
	raw: unknown,
	entityName: string,
	warnings: string[],
): FieldConfig | null {
	// A null or non-object field is completely unrecoverable — skip it.
	if (!raw || typeof raw !== "object") {
		warnings.push(`Entity "${entityName}": skipped a null or invalid field.`);
		return null;
	}

	// Cast to a loose record so we can safely access properties
	const obj = raw as Record<string, unknown>;

	// A field with no name is useless — we can't name a column with nothing.
	const name = typeof obj.name === "string" ? obj.name.trim() : "";
	if (!name) {
		warnings.push(
			`Entity "${entityName}": skipped a field with missing or empty name.`,
		);
		return null;
	}

	// If the type is invalid or missing, default it to 'string' and warn the user.
	const rawType = typeof obj.type === "string" ? obj.type.trim() : "";
	const isValidType = VALID_FIELD_TYPES.includes(rawType as any);
	if (!isValidType) {
		warnings.push(
			`Entity "${entityName}", field "${name}": unknown type "${rawType}", defaulting to "string".`,
		);
	}
	const type = isValidType
		? (rawType as FieldConfig["type"])
		: DEFAULT_FIELD_TYPE;

	// required defaults to false if missing or not a boolean
	const required = typeof obj.required === "boolean" ? obj.required : false;

	// For select fields, options must be an array of strings. Sanitize accordingly.
	let options: string[] | undefined;
	if (type === "select") {
		if (Array.isArray(obj.options)) {
			options = obj.options.filter((o): o is string => typeof o === "string");
			if (options.length === 0) {
				warnings.push(
					`Entity "${entityName}", field "${name}": select field has no valid options, adding placeholder.`,
				);
				options = ["Option 1"];
			}
		} else {
			warnings.push(
				`Entity "${entityName}", field "${name}": select field missing options, adding placeholder.`,
			);
			options = ["Option 1"];
		}
	}

	return { name, type, required, ...(options && { options }) };
}

// ─── Entity Normalizer ───────────────────────────────────────────────────────

function normalizeEntity(
	raw: unknown,
	warnings: string[],
): EntityConfig | null {
	if (!raw || typeof raw !== "object") {
		warnings.push("Skipped a null or invalid entity.");
		return null;
	}

	const e = raw as Record<string, unknown>;
	const name = typeof e.name === "string" ? e.name.trim() : "";
	if (!name) {
		warnings.push("Skipped an entity with missing or empty name.");
		return null;
	}

	// Process fields — filter out any that couldn't be normalized
	const rawFields = Array.isArray(e.fields) ? e.fields : [];
	if (!Array.isArray(e.fields)) {
		warnings.push(
			`Entity "${name}": fields is missing or not an array, defaulting to empty.`,
		);
	}

	const fields: FieldConfig[] = rawFields
		.map((f) => normalizeField(f, name, warnings))
		.filter((f): f is FieldConfig => f !== null); // type-safe filter for non-null

	// An entity with zero fields still gets created — it just has no columns.
	// You could also choose to skip it. Either is a valid design decision.
	return { name, fields };
}

// ─── Widget Normalizer ───────────────────────────────────────────────────────

function normalizeWidget(
	raw: unknown,
	pageName: string,
	warnings: string[],
): WidgetConfig {
	if (!raw || typeof raw !== "object") {
		warnings.push(`Page "${pageName}": skipped an invalid widget.`);
		// Return a safe placeholder widget instead of null
		return { type: "unknown", label: "Invalid Widget" };
	}

	const w = raw as Record<string, unknown>;
	const label = typeof w.label === "string" ? w.label.trim() : "Unnamed Widget";
	const type = w.type === "stat" ? "stat" : "unknown";

	if (type === "unknown") {
		warnings.push(
			`Page "${pageName}": unknown widget type "${w.type}", rendering as placeholder.`,
		);
	}

	return {
		type,
		label,
		entity: typeof w.entity === "string" ? w.entity : undefined,
		aggregate: ["count", "sum", "avg"].includes(w.aggregate as string)
			? (w.aggregate as WidgetConfig["aggregate"])
			: undefined,
		field: typeof w.field === "string" ? w.field : undefined,
	};
}

// ─── Page Normalizer ─────────────────────────────────────────────────────────

function normalizePage(raw: unknown, warnings: string[]): PageConfig | null {
	if (!raw || typeof raw !== "object") {
		warnings.push("Skipped a null or invalid page.");
		return null;
	}

	const p = raw as Record<string, unknown>;
	const name = typeof p.name === "string" ? p.name.trim() : "Unnamed Page";
	const rawType = typeof p.type === "string" ? p.type.trim() : "";
	const isValidType = VALID_PAGE_TYPES.includes(rawType as any);

	if (!isValidType) {
		warnings.push(
			`Page "${name}": unknown type "${rawType}", will be rendered as an error placeholder.`,
		);
		// We keep the page but mark it as unknown — the renderer handles the rest
		return {
			name,
			type: UNKNOWN_PAGE_TYPE,
			_error: `Unknown page type: "${rawType}"`,
		};
	}

	const type = rawType as PageConfig["type"];

	// For table and form pages, entity is important — warn if it's missing
	if ((type === "table" || type === "form") && typeof p.entity !== "string") {
		warnings.push(
			`Page "${name}": type is "${type}" but no entity was specified.`,
		);
	}

	const widgets =
		type === "dashboard" && Array.isArray(p.widgets)
			? p.widgets.map((w) => normalizeWidget(w, name, warnings))
			: undefined;

	return {
		name,
		type,
		entity: typeof p.entity === "string" ? p.entity : undefined,
		action: ["create", "edit", "list"].includes(p.action as string)
			? (p.action as PageConfig["action"])
			: undefined,
		...(widgets && { widgets }),
	};
}

// ─── Top-Level Normalizer ────────────────────────────────────────────────────
// This is the one function entire system will call. It accepts `unknown`
// because genuinely don't trust what the user submitted.

export function normalizeConfig(raw: unknown): NormalizeResult {
	const warnings: string[] = [];

	// Handle the most catastrophic case — not even an object
	if (!raw || typeof raw !== "object") {
		warnings.push("Config is null or not an object. Returning empty app.");
		return {
			config: { appName: "Untitled App", entities: [], pages: [] },
			warnings,
		};
	}

	const r = raw as Record<string, unknown>;

	const appName =
		typeof r.appName === "string" && r.appName.trim()
			? r.appName.trim()
			: "Untitled App";

	if (appName === "Untitled App") {
		warnings.push('appName is missing or empty, defaulting to "Untitled App".');
	}

	// Normalize entities
	const rawEntities = Array.isArray(r.entities) ? r.entities : [];
	if (!Array.isArray(r.entities)) {
		warnings.push("entities is missing or not an array, defaulting to empty.");
	}
	const entities: EntityConfig[] = rawEntities
		.map((e) => normalizeEntity(e, warnings))
		.filter((e): e is EntityConfig => e !== null);

	// Normalize pages
	const rawPages = Array.isArray(r.pages) ? r.pages : [];
	if (!Array.isArray(r.pages)) {
		warnings.push("pages is missing or not an array, defaulting to empty.");
	}
	const pages: PageConfig[] = rawPages
		.map((p) => normalizePage(p, warnings))
		.filter((p): p is PageConfig => p !== null);

	return {
		config: { appName, entities, pages },
		warnings,
	};
}
