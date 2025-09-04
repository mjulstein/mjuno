// App.tsx - Main application component
import './App.css';
import { Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { type FC, Suspense } from 'react';

/**
 * Application layout (root route component)
 */
export const App: FC = () => (
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
          <li>
            <Link to="/css-repl">Css repl</Link>
          </li>
          <li>
            <Link to="/slate-md-demo">Slate Markdown Demo</Link>
          </li>
        </ul>
      </nav>
    </header>
    <Suspense fallback={<div>Loading…</div>}>
      <Outlet />
    </Suspense>
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
    {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
  </>
);
