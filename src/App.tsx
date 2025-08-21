// App.tsx - Main application component
import './App.css';
import React from 'react';
import { Link, Outlet } from '@tanstack/react-router';

/**
 * Application layout (root route component)
 */
export const App: React.FC = () => (
  <>
    <header>
      <h1>
        <Link to="/">MJU.no</Link>
      </h1>
      <nav>
        <ul>
          <li>
            <a
              href="https://scheduler.mju.no"
              target="_blank"
              rel="noopener noreferrer"
            >
              Scheduler
            </a>
          </li>
          <li>
            <Link to="/pantry-wall">Pantry wall</Link>
          </li>
        </ul>
      </nav>
    </header>
    <React.Suspense fallback={<div>Loading…</div>}>
      <Outlet />
    </React.Suspense>
    <footer>
      <p>
        The content of mju.no is open source and maintained on{' '}
        <a
          href="https://github.com/mjulstein"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
      </p>
    </footer>
  </>
);
