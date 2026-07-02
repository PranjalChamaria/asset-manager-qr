import { QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// createHashHistory is required for the Electron production build because
// the app loads via file:// — browser history APIs don't work without a real
// HTTP server. Hash-based routing (#/) works identically in both the browser
// dev server and the Electron file:// context.
const hashHistory = createHashHistory();

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    history: hashHistory,
    context: { queryClient },
    defaultPreloadStaleTime: 0,
  });

  return router;
};
