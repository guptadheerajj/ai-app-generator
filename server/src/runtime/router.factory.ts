// server/src/runtime/router.factory.ts
import { Router, Request, Response } from "express";
import { AppConfig } from "../../../shared/src/types";
import {
	getAllRows,
	getRowById,
	createRow,
	updateRow,
	deleteRow,
} from "./crud.service";

// Takes a config and returns a router with all entity routes registered
export function buildRuntimeRouter(
	config: AppConfig,
	configId: string,
): Router {
	const router = Router();

	config.entities.forEach((entity) => {
		const entityPath = entity.name.toLowerCase().replace(/\s+/g, "-");

		console.log(
			`  Registering routes for entity: ${entity.name} at /api/runtime/${entityPath}`,
		);

		// GET /api/runtime/:entity — list all rows
		router.get(`/${entityPath}`, async (req: Request, res: Response) => {
			try {
				const filters = req.query as Record<string, string>;
				const rows = await getAllRows(entity.name, configId, filters);
				res.json({ success: true, data: rows, entity: entity.name });
			} catch (error) {
				console.error(`Error fetching ${entity.name}:`, error);
				res.status(500).json({
					success: false,
					error: `Failed to fetch ${entity.name} records`,
				});
			}
		});

		// GET /api/runtime/:entity/:id — get single row
		router.get(
			`/${entityPath}/:id`,
			async (req: Request<{ id: string }>, res: Response) => {
				try {
					const row = await getRowById(entity.name, req.params.id, configId);
					if (!row) {
						res.status(404).json({ success: false, error: "Record not found" });
						return;
					}
					res.json({ success: true, data: row });
				} catch (error) {
					res
						.status(500)
						.json({ success: false, error: "Failed to fetch record" });
				}
			},
		);

		// POST /api/runtime/:entity — create a row
		router.post(`/${entityPath}`, async (req: Request, res: Response) => {
			try {
				// Validate required fields before hitting the database
				const validationErrors = validatePayload(req.body, entity.fields);
				if (validationErrors.length > 0) {
					res.status(400).json({ success: false, errors: validationErrors });
					return;
				}

				const row = await createRow(entity.name, configId, req.body);
				res.status(201).json({ success: true, data: row });
			} catch (error) {
				res
					.status(500)
					.json({ success: false, error: "Failed to create record" });
			}
		});

		// PUT /api/runtime/:entity/:id — update a row
		router.put(
			`/${entityPath}/:id`,
			async (req: Request<{ id: string }>, res: Response) => {
				try {
					const row = await updateRow(
						entity.name,
						req.params.id,
						configId,
						req.body,
					);
					if (!row) {
						res.status(404).json({ success: false, error: "Record not found" });
						return;
					}
					res.json({ success: true, data: row });
				} catch (error) {
					res
						.status(500)
						.json({ success: false, error: "Failed to update record" });
				}
			},
		);

		// DELETE /api/runtime/:entity/:id — delete a row
		router.delete(
			`/${entityPath}/:id`,
			async (req: Request<{ id: string }>, res: Response) => {
				try {
					await deleteRow(entity.name, req.params.id, configId);
					res.json({ success: true, message: "Record deleted" });
				} catch (error) {
					res
						.status(500)
						.json({ success: false, error: "Failed to delete record" });
				}
			},
		);
	});

	return router;
}

// Validates that required fields are present in the request body
function validatePayload(
	body: Record<string, unknown>,
	fields: AppConfig["entities"][0]["fields"],
): string[] {
	const errors: string[] = [];

	fields.forEach((field) => {
		if (field.required) {
			const value = body[field.name];
			if (value === undefined || value === null || value === "") {
				errors.push(`Field "${field.name}" is required`);
			}
		}

		// Type validation
		if (body[field.name] !== undefined) {
			if (field.type === "email") {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(String(body[field.name]))) {
					errors.push(`Field "${field.name}" must be a valid email`);
				}
			}
			if (field.type === "number" && isNaN(Number(body[field.name]))) {
				errors.push(`Field "${field.name}" must be a number`);
			}
		}
	});

	return errors;
}
