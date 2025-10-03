"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ClerkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if this is a Clerk-related error
    if (error.message.includes('failed_to_load_clerk_js_timeout') || 
        error.message.includes('Clerk')) {
      return { hasError: true, error };
    }
    
    // For non-Clerk errors, don't catch them
    return { hasError: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.message.includes('Clerk') || error.message.includes('failed_to_load_clerk_js_timeout')) {
      console.error("Clerk loading error:", error, errorInfo);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <div className="mb-4">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Authentication Service Unavailable
              </h1>
              <p className="text-gray-600 mb-6">
                The authentication service is taking longer than expected to load. 
                This might be due to a slow network connection.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry Loading
              </button>
              
              <button
                onClick={() => {
                  // Clear any cached Clerk data
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Cache & Retry
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Error: {this.state.error?.message || 'Unknown authentication error'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ClerkErrorBoundary;