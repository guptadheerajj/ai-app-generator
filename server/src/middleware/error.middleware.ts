import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
	err: Error,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	console.error("Unhandled error:", err.message);
	console.error(err.stack);

	res.status(500).json({
		success: false,
		error: "Internal server error",
		...(process.env.NODE_ENV === "development" && { detail: err.message }),
	});
}
