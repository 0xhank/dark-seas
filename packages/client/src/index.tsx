import ReactDOM from "react-dom/client";
import { App } from "./App";

const rootElement = document.getElementById("react-root");
if (!rootElement) throw new Error("React root not found");

ReactDOM.createRoot(rootElement).render(<App />);
