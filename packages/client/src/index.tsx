import ReactDOM from "react-dom/client";
import { Routes } from "./Routes";

const rootElement = document.getElementById("react-root");
if (!rootElement) throw new Error("React root not found");

ReactDOM.createRoot(rootElement).render(<Routes />);
