// server/src/index.ts
import express, { Request, Router, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { configRouter } from "./config/config.routes";
import { buildRuntimeRouter } from "./runtime/router.factory";
import { loadConfig } from "./config/config.service";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" })); // configs can be large

// ── Static Routes ────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
	res.json({ status: "ok" });
});

// Config management routes (save, load, list)
app.use("/api/config", configRouter);

// ── Dynamic Runtime Router ───────────────────────────────────────────────────
// This is the interesting part. We use a middleware layer that delegates to
// a dynamically-assigned router. When a new config is loaded, we swap the router.

let activeRuntimeRouter = Router(); // starts empty

// This middleware always delegates to whatever activeRuntimeRouter currently is.
// It acts as a stable mount point that points to a swappable inner router.
app.use("/api/runtime", (req: Request, res: Response, next: NextFunction) => {
	activeRuntimeRouter(req, res, next);
});

// This endpoint activates a config — loads it from DB and hot-swaps the router
app.post(
	"/api/activate/:configId",
	async (req: Request<{ configId: string }>, res: Response) => {
		try {
			const result = await loadConfig(req.params.configId);
			if (!result) {
				res.status(404).json({ success: false, error: "Config not found" });
				return;
			}

			// Build a new router from this config and swap it in
			activeRuntimeRouter = buildRuntimeRouter(result.config, result.id);

			console.log(
				`\n✓ Activated config: "${result.config.appName}" (${result.id})`,
			);
			res.json({
				success: true,
				message: `Config "${result.config.appName}" is now active`,
				entities: result.config.entities.map((e) => e.name),
			});
		} catch (error) {
			console.error("Error activating config:", error);
			res
				.status(500)
				.json({ success: false, error: "Failed to activate configuration" });
		}
	},
);

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error("Unhandled error:", err.message);
	res.status(500).json({ success: false, error: "Internal server error" });
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`\nServer running on http://localhost:${PORT}`);
	console.log("Endpoints:");
	console.log("  POST   /api/config          — Save a new config");
	console.log("  GET    /api/config          — List all configs");
	console.log("  GET    /api/config/:id      — Load a config");
	console.log(
		"  POST   /api/activate/:id    — Activate a config (registers dynamic routes)",
	);
	console.log(
		"  *      /api/runtime/*       — Dynamic entity routes (after activation)\n",
	);
});
