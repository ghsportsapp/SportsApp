import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeBundleOptimizations } from "./utils/bundle-optimizer";
import { performanceMonitor } from "./utils/performance-monitor";
import { memoryOptimizer } from "./utils/memory-optimizer";
import { generateOptimizationReport } from "./utils/performance-report";
import { generateFinalOptimizationReport } from "./utils/final-optimization-check";

// Initialize all performance optimizations
initializeBundleOptimizations();
memoryOptimizer.startMemoryMonitoring();

// Performance-monitored app rendering
const root = createRoot(document.getElementById("root")!);

performanceMonitor.measureRender('App', () => {
  root.render(<App />);
});

// Service Worker registration - handle both HTTPS (vite-plugin-pwa) and HTTP (manual)
if ('serviceWorker' in navigator) {
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '[::1]';
  
  const isHTTPS = window.location.protocol === 'https:';
  
  // For HTTP production environments, use manual registration
  if (!isHTTPS && !isLocalhost) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/http-sw.js')
        .then((registration) => {
          console.log('HTTP SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('HTTP SW registration failed: ', registrationError);
        });
    });
  }
  // For localhost and HTTPS, vite-plugin-pwa handles it automatically
}

// Log comprehensive optimization reports in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    console.log(generateOptimizationReport());
  }, 3000);
  
  setTimeout(() => {
    console.log(generateFinalOptimizationReport());
  }, 10000);
}
