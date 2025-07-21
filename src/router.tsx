import React from 'react';
import { HashRouter, BrowserRouter } from 'react-router-dom';

// Change this variable to switch routers for different environments
export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use HashRouter for GitHub Pages/static hosting, BrowserRouter for Node/server
  const useHash = false; // Set to false to use BrowserRouter
  if (useHash) {
    return <HashRouter>{children}</HashRouter>;
  }
  return <BrowserRouter>{children}</BrowserRouter>;
};

