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

// Log comprehensive optimization reports in development
if (import.meta.env.DEV) {
  setTimeout(() => {
    console.log(generateOptimizationReport());
  }, 3000);
  
  setTimeout(() => {
    console.log(generateFinalOptimizationReport());
  }, 10000);
}
