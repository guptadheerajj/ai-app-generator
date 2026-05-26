// src/config/constants.ts

// These are the only field types system knows how to handle.
// Anything outside this list will be treated as unknown and defaulted to 'string'.
export const VALID_FIELD_TYPES = [
	"string",
	"number",
	"boolean",
	"email",
	"date",
	"select",
] as const;

// These are the only page types rendering engine knows how to render.
// Anything outside this list gets rendered as an error placeholder - not a crash.
export const VALID_PAGE_TYPES = ["table", "form", "dashboard"] as const;

// When a field type is missing or invalid, fall back to this.
export const DEFAULT_FIELD_TYPE = "string";

// When a page type is unrecognized, mark it this way so the renderer knows to show a placeholder.
export const UNKNOWN_PAGE_TYPE = "unknown";
