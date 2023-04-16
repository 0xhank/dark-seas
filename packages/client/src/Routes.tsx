import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { App } from "./App";
import { HomePage } from "./Homepage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage showButton />,
  },
  {
    path: "/app",
    element: <App />,
  },
]);

export const Routes = () => {
  return <RouterProvider router={router} fallbackElement={<HomePage />} />;
};
