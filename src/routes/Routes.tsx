import { Route, Routes as RouterDomRoutes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Home from './page';

// Lazy load PantryWall route
const PantryWallLazy = lazy(() => import('./pantry-wall'));
export const Routes = () => {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <RouterDomRoutes>
        <Route path="/" element={<Home />} />
        <Route path="/pantry-wall" element={<PantryWallLazy />} />
      </RouterDomRoutes>
    </Suspense>
  );
};
