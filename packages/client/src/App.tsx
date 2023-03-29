import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Home } from "./home/Home";
import { HomePage } from "./Homepage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage showButton />,
  },
  {
    path: "/:worldAddress/:block?",
    element: <HomePage />,
  },
  {
    path: "/app",
    element: <Home />,
  },
]);

export const App = () => {
  return <RouterProvider router={router} fallbackElement={<HomePage />} />;
};
