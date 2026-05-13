import { createHashRouter } from "react-router";
import { Onboarding } from "./screens/Onboarding";
import { MainView } from "./screens/MainView";

export const router = createHashRouter([
  {
    path: "/",
    Component: Onboarding,
  },
  {
    path: "/main",
    Component: MainView,
  },
]);
