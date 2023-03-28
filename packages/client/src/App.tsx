import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Game } from "./Game";
import { HomePage } from "./react/Homepage/Homepage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage showButtons={false} />,
  },
  {
    path: "/:worldAddress/:block?",
    element: <Game />,
  },
]);
export const App = () => {
  return <RouterProvider router={router} fallbackElement={<HomePage />} />;
};
