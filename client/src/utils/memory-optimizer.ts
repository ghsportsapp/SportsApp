// Memory optimization utilities

class MemoryOptimizer {
  private intervalId: NodeJS.Timeout | null = null;
  private observers: Set<() => void> = new Set();

  // Monitor memory usage
  startMemoryMonitoring() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
      this.cleanupUnusedResources();
    }, 30000); // Every 30 seconds
  }

  stopMemoryMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1048576; // MB
      const total = memory.totalJSHeapSize / 1048576; // MB
      const limit = memory.jsHeapSizeLimit / 1048576; // MB

      // Alert if memory usage is high
      if (used > limit * 0.8) {
        console.warn(`⚠️  High memory usage: ${used.toFixed(1)}MB / ${limit.toFixed(1)}MB`);
        this.triggerGarbageCollection();
      }
    }
  }

  private triggerGarbageCollection() {
    // Force garbage collection by creating and destroying large objects
    if ('gc' in window) {
      (window as any).gc();
    } else {
      // Fallback: create pressure to trigger GC
      const arrays: any[] = [];
      for (let i = 0; i < 10; i++) {
        arrays.push(new Array(100000).fill(null));
      }
      arrays.length = 0;
    }

    // Notify observers
    this.observers.forEach(callback => callback());
  }

  private cleanupUnusedResources() {
    // Cleanup blob URLs
    const scripts = document.querySelectorAll('script[src^="blob:"]');
    scripts.forEach(script => {
      URL.revokeObjectURL(script.getAttribute('src')!);
    });

    // Cleanup unused image object URLs
    const images = document.querySelectorAll('img[src^="blob:"]');
    images.forEach(img => {
      if (!img.isConnected) {
        URL.revokeObjectURL(img.getAttribute('src')!);
      }
    });
  }

  // Register cleanup callback
  onMemoryPressure(callback: () => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  // Object pool for reusing objects
  createObjectPool<T>(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 10
  ) {
    const pool: T[] = [];

    return {
      acquire(): T {
        if (pool.length > 0) {
          return pool.pop()!;
        }
        return createFn();
      },

      release(obj: T) {
        if (pool.length < maxSize) {
          resetFn(obj);
          pool.push(obj);
        }
      },

      clear() {
        pool.length = 0;
      }
    };
  }

  // Weak cache for temporary data
  createWeakCache<K extends object, V>() {
    const cache = new WeakMap<K, V>();

    return {
      get(key: K): V | undefined {
        return cache.get(key);
      },

      set(key: K, value: V) {
        cache.set(key, value);
      },

      has(key: K): boolean {
        return cache.has(key);
      },

      delete(key: K): boolean {
        return cache.delete(key);
      }
    };
  }

  // Memory-efficient event handler cleanup
  setupEventCleanup() {
    const listeners = new WeakMap<Element, AbortController>();

    return {
      addEventListener(
        element: Element,
        event: string,
        handler: EventListener,
        options?: AddEventListenerOptions
      ) {
        if (!listeners.has(element)) {
          listeners.set(element, new AbortController());
        }

        const controller = listeners.get(element)!;
        element.addEventListener(event, handler, {
          ...options,
          signal: controller.signal
        });
      },

      removeAllListeners(element: Element) {
        const controller = listeners.get(element);
        if (controller) {
          controller.abort();
          listeners.delete(element);
        }
      }
    };
  }
}

export const memoryOptimizer = new MemoryOptimizer();

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  memoryOptimizer.startMemoryMonitoring();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  memoryOptimizer.stopMemoryMonitoring();
});