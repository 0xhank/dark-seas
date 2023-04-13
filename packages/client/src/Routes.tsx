import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { App } from "./App";
import { Game } from "./game/Game";
import { HomeWindow } from "./home/components/HomeWindow";
import { HomePage } from "./Homepage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage showButton />,
  },
  {
    path: "/:worldAddress/:block?",
    element: <HomePage showButton />,
  },
  {
    path: "/game/:worldAddress",
    element: <App child={<Game />} />,
  },
  {
    path: "/game",
    element: <App child={<Game />} />,
  },
  {
    path: "/app",
    element: <App child={<HomeWindow />} />,
  },
]);

export const Routes = () => {
  return <RouterProvider router={router} fallbackElement={<HomePage />} />;
};
