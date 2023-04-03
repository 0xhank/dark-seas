import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Game } from "./game/Game";
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
]);

export const App = () => {
  return <RouterProvider router={router} fallbackElement={<HomePage />} />;
};
