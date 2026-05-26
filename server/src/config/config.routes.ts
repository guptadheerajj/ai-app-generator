// server/src/config/config.routes.ts
import { Router, Request, Response } from "express";
import { saveConfig, loadConfig, listConfigs } from "./config.service";

export const configRouter = Router();

// POST /api/config — submit a new JSON config
configRouter.post("/", async (req: Request, res: Response) => {
	try {
		const { id, result } = await saveConfig(req.body);
		res.status(201).json({
			success: true,
			configId: id,
			config: result.config,
			warnings: result.warnings, // send warnings back so the UI can show them
		});
	} catch (error) {
		console.error("Error saving config:", error);
		res
			.status(500)
			.json({ success: false, error: "Failed to save configuration" });
	}
});

// GET /api/config — list all saved configs
configRouter.get("/", async (_req: Request, res: Response) => {
	try {
		const configs = await listConfigs();
		res.json({ success: true, data: configs });
	} catch (error) {
		res
			.status(500)
			.json({ success: false, error: "Failed to list configurations" });
	}
});

// GET /api/config/:id — load a specific config by id
configRouter.get(
	"/:id",
	async (req: Request<{ id: string }>, res: Response) => {
		try {
			const result = await loadConfig(req.params.id);
			if (!result) {
				res.status(404).json({ success: false, error: "Config not found" });
				return;
			}
			res.json({ success: true, data: result });
		} catch (error) {
			res
				.status(500)
				.json({ success: false, error: "Failed to load configuration" });
		}
	},
);
