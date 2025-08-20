// App.tsx - Main application component
import './App.css';
import { Link, Route, Routes, Navigate } from 'react-router-dom';
import React from 'react';

/**
 * Main application component
 */
export const App = () => (
  <main>
    <h1>Welcome to MJU.no</h1>
    <section>
      <h2>Tools</h2>
      <ul>
        <li>
          <a href="https://scheduler.mju.no" target="_blank" rel="noopener noreferrer">
            Scheduler
          </a>
        </li>
        <li>
          <Link to="/pantry-wall">Pantry wall</Link>
        </li>
      </ul>
    </section>

    {/* Routes */}
    <React.Suspense fallback={<div>Loading…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pantry-wall" element={<TestSheetLazy />} />
        <Route path="/test-sheet" element={<Navigate to="/pantry-wall" replace />} />
      </Routes>
    </React.Suspense>
  </main>
);

// Simple Home component to render existing landing content when at "/"
const Home: React.FC = () => (
  <div>
    {/* Existing landing content is above */}
  </div>
);

// Lazy load TestSheet route
const TestSheetLazy = React.lazy(() => import('./routes/TestSheet'));
