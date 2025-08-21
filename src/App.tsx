// App.tsx - Main application component
import './App.css';
import { Link } from 'react-router-dom';
import { Routes } from './routes';

/**
 * Main application component
 */
export const App = () => (
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
    <Routes />
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
