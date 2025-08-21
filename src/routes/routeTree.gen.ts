import { createRootRoute, createRoute } from '@tanstack/react-router';
import { App } from '../App';
import { lazy } from 'react';

// Root layout route uses <App /> which renders the header/nav + <Outlet />
const rootRoute = createRootRoute({ component: App });

const HomeLazy = lazy(() => import('./page'));
const PantryWallLazy = lazy(() => import('./pantry-wall'));
// Index (home) route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeLazy,
});

const pantryWallRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pantry-wall',
  component: PantryWallLazy,
});

// Add children to root and export the tree consumed by the router
export const routeTree = rootRoute.addChildren([
  indexRoute,
  pantryWallRoute,
]);

// (Optional) export individual routes if needed elsewhere
export { rootRoute, indexRoute, pantryWallRoute };
