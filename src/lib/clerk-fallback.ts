// Client-side Clerk recovery utilities

export function initializeClerkFallback() {
  if (typeof window === 'undefined') return;

  // Add a global timeout to detect if Clerk fails to load
  const clerkTimeout = setTimeout(() => {
    if (!(window as any).Clerk || !(window as any).Clerk.loaded) {
      console.warn('🔐 Clerk did not load within expected time, attempting recovery');
      
      // Try to reinitialize Clerk
      const script = document.createElement('script');
      script.src = 'https://js.clerk.dev/v4/clerk.browser.js';
      script.async = true;
      script.onload = () => {
        console.log('🔐 Clerk script reloaded');
      };
      script.onerror = () => {
        console.error('🔐 Failed to reload Clerk script');
      };
      
      // Only add if not already present
      if (!document.querySelector('script[src*="clerk.browser.js"]')) {
        document.head.appendChild(script);
      }
    }
  }, 12000); // 12 second timeout

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    clearTimeout(clerkTimeout);
  });

  // Listen for Clerk load success
  window.addEventListener('clerk:loaded', () => {
    clearTimeout(clerkTimeout);
    console.log('🔐 Clerk loaded successfully');
  });
}

// Simple retry mechanism that doesn't require full page reload
export function retryClerkInitialization() {
  return new Promise<boolean>((resolve, reject) => {
    const maxRetries = 3;
    let attempts = 0;

    const attemptLoad = () => {
      attempts++;
      
      if ((window as any).Clerk?.loaded) {
        resolve(true);
        return;
      }

      if (attempts >= maxRetries) {
        reject(new Error('Failed to initialize Clerk after maximum retries'));
        return;
      }

      console.log(`🔐 Attempting to initialize Clerk (${attempts}/${maxRetries})`);
      
      // Wait and try again
      setTimeout(attemptLoad, 2000);
    };

    attemptLoad();
  });
}