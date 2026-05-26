import {
	VALID_FIELD_TYPES,
	VALID_PAGE_TYPES,
	UNKNOWN_PAGE_TYPE,
} from "./constants";

// Deriving union types directly from constants array means, only
// define valid values in ONE place. If add 'textarea' to VALID_FIELD_TYPES,
// the FieldType type automatically includes it. No duplication.
export type FieldType = (typeof VALID_FIELD_TYPES)[number]; // 'string' | 'number' | 'boolean' | ...
export type PageType =
	| (typeof VALID_PAGE_TYPES)[number]
	| typeof UNKNOWN_PAGE_TYPE;

// A single field on an entity — e.g. { name: 'email', type: 'email', required: true }
export interface FieldConfig {
	name: string;
	type: FieldType;
	required: boolean;
	// For 'select' type fields, these are the dropdown options
	options?: string[];
}

// An entity is a data model — like a database table.
// e.g. { name: 'Employee', fields: [...] }
export interface EntityConfig {
	name: string; // becomes the table name in your DB
	fields: FieldConfig[];
}

// A widget lives inside a dashboard page — e.g. a stat card or a chart
export interface WidgetConfig {
	type: "stat" | "unknown";
	label: string;
	entity?: string; // which entity to pull data from
	aggregate?: "count" | "sum" | "avg";
	field?: string; // for sum/avg, which numeric field to aggregate
}

// A page represents one screen in the generated app
export interface PageConfig {
	name: string;
	type: PageType; // 'table' | 'form' | 'dashboard' | 'unknown'
	entity?: string; // which entity this page works with (for table/form)
	action?: "create" | "edit" | "list"; // relevant for form pages
	widgets?: WidgetConfig[]; // relevant for dashboard pages
	// This flag is set by the normalizer when it detects a broken page.
	// The renderer checks this and shows a graceful error instead of crashing.
	_error?: string;
}

// The top-level config — this is what users will submit as JSON
export interface AppConfig {
	appName: string;
	entities: EntityConfig[];
	pages: PageConfig[];
}

// This is what your normalizeConfig() function returns —
// the raw unknown input on one side, the safe AppConfig on the other.
export interface NormalizeResult {
	config: AppConfig;
	// A log of every issue found and how it was handled.
	// Great for showing in the UI so the user understands what was corrected.
	warnings: string[];
}
