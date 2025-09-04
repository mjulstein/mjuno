import { createRootRoute, createRoute } from '@tanstack/react-router';
import { App } from '../App';
import { lazy } from 'react';

// Root layout route uses <App /> which renders the header/nav + <Outlet />
const rootRoute = createRootRoute({ component: App });

const HomeLazy = lazy(() => import('./page'));
const PantryWallLazy = lazy(() => import('./pantry-wall'));
const CssReplLazy = lazy(() => import('./css-repl'));
const SlateMdDemoLazy = lazy(() => import('./slate-md-demo'));
// Index (home) route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeLazy
});

const pantryWallRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pantry-wall',
  component: PantryWallLazy
});
const CssReplRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'css-repl',
  component: CssReplLazy
});
const SlateMdDemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'slate-md-demo',
  component: SlateMdDemoLazy
});

// Add children to root and export the tree consumed by the router
export const routeTree = rootRoute.addChildren([
  indexRoute,
  pantryWallRoute,
  CssReplRoute,
  SlateMdDemoRoute
]);

// (Optional) export individual routes if needed elsewhere
export { rootRoute, indexRoute, pantryWallRoute, SlateMdDemoRoute };
