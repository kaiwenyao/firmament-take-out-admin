import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App"; // Your main layout component
import Login from "./pages/Login"; // Login page
import ProtectedLayout from "./components/ProtectedLayout"; // Route guard component

// Import page components
import Dashboard from "./pages/Dashboard";
import Statistics from "./pages/Statistics";
import Order from "./pages/Order";
import Setmeal from "./pages/Setmeal";
import Dish from "./pages/Dish";
import Category from "./pages/Category";
import Employee from "./pages/Employee";
import NotFound from "./pages/NotFound";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    errorElement: <NotFound />, // Global error handling
    children: [
      {
        element: <App />, // App is the layout container (includes sidebar/header)
        children: [
          {
            // When accessing "/", auto-redirect to "/dashboard"
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "statistics",
            element: <Statistics />,
          },
          {
            path: "order",
            element: <Order />,
          },
          {
            path: "setmeal", // Setmeal
            element: <Setmeal />,
          },
          {
            path: "dish", // Dish
            element: <Dish />,
          },
          {
            path: "category", // Category
            element: <Category />,
          },
          {
            path: "employee", // Employee
            element: <Employee />,
          },
        ],
      },
    ],
  },
  {
    // Catch all undefined routes, show 404 page
    path: "*",
    element: <NotFound />,
  },
]);

export default router;