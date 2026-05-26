import axios from "axios";
import type { AppConfig, NormalizeResult } from "@shared/types";

const http = axios.create({ baseURL: "/api" });

export const configApi = {
	save: async (
		raw: unknown,
	): Promise<{ configId: string; config: AppConfig; warnings: string[] }> => {
		const { data } = await http.post("/config", raw);
		return data;
	},

	list: async (): Promise<
		{ id: string; name: string; createdAt: string }[]
	> => {
		const { data } = await http.get("/config");
		return data.data;
	},

	load: async (id: string): Promise<{ id: string; config: AppConfig }> => {
		const { data } = await http.get(`/config/${id}`);
		return data.data;
	},

	activate: async (
		id: string,
	): Promise<{ entities: string[]; routes: string[] }> => {
		const { data } = await http.post(`/activate/${id}`);
		return data;
	},
};

export const runtimeApi = {
	getAll: async (entity: string): Promise<unknown[]> => {
		const { data } = await http.get(`/runtime/${entity.toLowerCase()}`);
		return data.data;
	},

	create: async (
		entity: string,
		payload: Record<string, unknown>,
	): Promise<unknown> => {
		const { data } = await http.post(
			`/runtime/${entity.toLowerCase()}`,
			payload,
		);
		return data.data;
	},

	update: async (
		entity: string,
		id: string,
		payload: Record<string, unknown>,
	): Promise<unknown> => {
		const { data } = await http.put(
			`/runtime/${entity.toLowerCase()}/${id}`,
			payload,
		);
		return data.data;
	},

	remove: async (entity: string, id: string): Promise<void> => {
		await http.delete(`/runtime/${entity.toLowerCase()}/${id}`);
	},
};
