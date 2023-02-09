import ReactDOM from "react-dom/client";
import { App } from "./App";
import { MUDProvider } from "./MUDContext";
import { setupMUD } from "./setupMUD";

const rootElement = document.getElementById("react-root");
if (!rootElement) throw new Error("React root not found");
const root = ReactDOM.createRoot(rootElement);

// TODO: figure out if we actually want this to be async or if we should render something else in the meantime
// TODO: expose result in some sort of global store so it can be accessed outside of react/hooks
setupMUD().then((result) => {
  root.render(
    <MUDProvider {...result}>
      <App />
      {/* {import.meta.env.DEV ? <ComponentBrowser /> : null} */}
    </MUDProvider>
  );
});
