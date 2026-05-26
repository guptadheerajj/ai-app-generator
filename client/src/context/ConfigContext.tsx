import { createContext, useContext, useState, ReactNode } from "react";
import type { AppConfig } from "@shared/types";
import { configApi } from "../api/client";

interface ConfigContextValue {
	config: AppConfig | null;
	configId: string | null;
	warnings: string[];
	isLoading: boolean;
	error: string | null;
	submitConfig: (raw: unknown) => Promise<void>;
	activateConfig: (id: string) => Promise<void>;
	savedConfigs: { id: string; name: string; createdAt: string }[];
	loadSavedConfigs: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
	const [config, setConfig] = useState<AppConfig | null>(null);
	const [configId, setConfigId] = useState<string | null>(null);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savedConfigs, setSavedConfigs] = useState<
		{ id: string; name: string; createdAt: string }[]
	>([]);

	const submitConfig = async (raw: unknown) => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await configApi.save(raw);
			setConfig(result.config);
			setConfigId(result.configId);
			setWarnings(result.warnings);
			// Activate immediately after saving
			await configApi.activate(result.configId);
		} catch (err) {
			setError("Failed to save or activate config. Check your JSON.");
		} finally {
			setIsLoading(false);
		}
	};

	const activateConfig = async (id: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const loaded = await configApi.load(id);
			await configApi.activate(id);
			setConfig(loaded.config);
			setConfigId(loaded.id);
			setWarnings([]);
		} catch (err) {
			setError("Failed to activate config.");
		} finally {
			setIsLoading(false);
		}
	};

	const loadSavedConfigs = async () => {
		const list = await configApi.list();
		setSavedConfigs(list);
	};

	return (
		<ConfigContext.Provider
			value={{
				config,
				configId,
				warnings,
				isLoading,
				error,
				submitConfig,
				activateConfig,
				savedConfigs,
				loadSavedConfigs,
			}}
		>
			{children}
		</ConfigContext.Provider>
	);
}

export function useConfig() {
	const ctx = useContext(ConfigContext);
	if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
	return ctx;
}
