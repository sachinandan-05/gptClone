// Clerk timeout detection and handling utility

export function createClerkTimeoutHandler() {
  let timeoutId: NodeJS.Timeout;
  let isClerkLoaded = false;
  
  // Check if Clerk is loaded
  const checkClerkLoaded = () => {
    return typeof window !== 'undefined' && 
           (window as any).Clerk !== undefined &&
           (window as any).Clerk.loaded === true;
  };

  // Start timeout monitoring
  const startTimeoutMonitoring = (timeoutMs: number = 10000) => {
    return new Promise<boolean>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        if (!checkClerkLoaded()) {
          console.error('🔐 Clerk loading timeout after', timeoutMs, 'ms');
          reject(new Error('failed_to_load_clerk_js_timeout'));
        }
      }, timeoutMs);

      // Check periodically if Clerk has loaded
      const checkInterval = setInterval(() => {
        if (checkClerkLoaded()) {
          isClerkLoaded = true;
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          console.log('🔐 Clerk loaded successfully');
          resolve(true);
        }
      }, 500);

      // Also listen for Clerk's ready event
      if (typeof window !== 'undefined') {
        window.addEventListener('clerk:loaded', () => {
          isClerkLoaded = true;
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          console.log('🔐 Clerk loaded via event');
          resolve(true);
        });
      }
    });
  };

  // Clean up timeout
  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return {
    startTimeoutMonitoring,
    cleanup,
    isLoaded: () => isClerkLoaded,
    checkClerkLoaded
  };
}

// Global error handler for Clerk timeout errors
export function setupClerkErrorHandling() {
  if (typeof window === 'undefined') return;

  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    // Check if this is a Clerk timeout error
    const errorString = args.join(' ');
    if (errorString.includes('failed_to_load_clerk_js_timeout')) {
      console.warn('🔐 Clerk timeout detected, attempting recovery...');
      
      // Attempt to reload Clerk
      setTimeout(() => {
        if (!(window as any).Clerk || !(window as any).Clerk.loaded) {
          console.log('🔐 Attempting to reload page due to Clerk timeout');
          window.location.reload();
        }
      }, 2000);
    }
    
    // Call original console.error
    originalConsoleError.apply(console, args);
  };
}