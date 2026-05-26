import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "./context/ConfigContext";
import { HomePage } from "./pages/HomePage";
import { AppPage } from "./pages/AppPage";

export default function App() {
	return (
		<ConfigProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/app" element={<AppPage />} />
				</Routes>
			</BrowserRouter>
		</ConfigProvider>
	);
}
