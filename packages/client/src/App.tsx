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
    path: "/app",
    element: <Home />,
  },
  {
    path: "/:worldAddress/:block?",
    element: <Game />,
  },
]);

export const App = () => {
  return <RouterProvider router={router} fallbackElement={<HomePage />} />;
};
