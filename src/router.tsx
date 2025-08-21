import React from 'react';
import { createRouter, RouterProvider as TanStackRouterProvider, createHashHistory, createBrowserHistory } from '@tanstack/react-router';
import { routeTree } from './routes';

// Toggle hash vs browser history (hash useful for GitHub Pages without proper 404 handling)
const useHash = false; // Adjust as needed

const history = useHash ? createHashHistory() : createBrowserHistory();

export const router = createRouter({
  routeTree,
  history,
});

// Augment router type for TS (module augmentation pattern)
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const RouterProvider: React.FC = () => {
  return <TanStackRouterProvider router={router} />;
};
