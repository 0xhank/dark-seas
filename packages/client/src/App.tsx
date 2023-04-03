import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Game } from "./game/Game";
import { Home } from "./home/Home";
import { HomePage } from "./Homepage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/:worldAddress/:block?",
    element: <HomePage showButton />,
  },
  {
    path: "/game",
    element: <Game />,
  },
  {
    path: "/app",
    element: <Home />,
  },
]);

export const App = () => {
  return <RouterProvider router={router} fallbackElement={<HomePage />} />;
};
