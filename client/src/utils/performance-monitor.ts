// Performance monitoring and optimization utilities

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private observers: IntersectionObserver[] = [];

  // Track component render times
  measureRender<T>(componentName: string, renderFn: () => T): T {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    this.recordMetric(`render_${componentName}`, end - start);
    return result;
  }

  // Track API call performance
  measureApiCall<T>(endpoint: string, apiFn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    return apiFn().then(
      result => {
        const end = performance.now();
        this.recordMetric(`api_${endpoint}`, end - start);
        return result;
      },
      error => {
        const end = performance.now();
        this.recordMetric(`api_error_${endpoint}`, end - start);
        throw error;
      }
    );
  }

  // Record metric
  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }

    // Log performance issues
    if (value > 100) { // More than 100ms
      console.warn(`⚠️  Performance Warning: ${name} took ${value.toFixed(2)}ms`);
    }
  }

  // Get performance summary
  getMetricsSummary(): Record<string, { avg: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      
      summary[name] = {
        avg: Number(avg.toFixed(2)),
        max: Number(max.toFixed(2)),
        count: values.length,
      };
    }
    
    return summary;
  }

  // Setup lazy loading observer
  setupLazyLoading(selector: string = '[data-lazy]') {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const src = element.dataset.src;
            
            if (src) {
              if (element.tagName === 'IMG') {
                (element as HTMLImageElement).src = src;
              } else {
                element.style.backgroundImage = `url(${src})`;
              }
              
              element.removeAttribute('data-lazy');
              observer.unobserve(element);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    // Observe existing elements
    document.querySelectorAll(selector).forEach(el => {
      observer.observe(el);
    });

    this.observers.push(observer);
    return observer;
  }

  // Monitor Core Web Vitals
  setupWebVitalsMonitoring() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.recordMetric('lcp', entry.startTime);
          }
          if (entry.entryType === 'first-input') {
            this.recordMetric('fid', (entry as any).processingStart - entry.startTime);
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    }

    // Cumulative Layout Shift
    let clsValue = 0;
    let clsEntries: any[] = [];

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
          }
        }
        this.recordMetric('cls', clsValue);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Memory usage monitoring
  monitorMemoryUsage() {
    const logMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize / 1048576); // MB
        this.recordMetric('memory_total', memory.totalJSHeapSize / 1048576); // MB
      }
    };

    // Log every 30 seconds
    setInterval(logMemory, 30000);
    logMemory(); // Initial log
  }

  // Cleanup
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }

  // Export performance data
  exportMetrics() {
    const data = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.getMetricsSummary(),
    };

    console.log('📊 Performance Metrics:', data);
    return data;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-setup on import
if (typeof window !== 'undefined') {
  performanceMonitor.setupLazyLoading();
  performanceMonitor.setupWebVitalsMonitoring();
  performanceMonitor.monitorMemoryUsage();

  // Export metrics every 5 minutes in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      performanceMonitor.exportMetrics();
    }, 5 * 60 * 1000);
  }
}