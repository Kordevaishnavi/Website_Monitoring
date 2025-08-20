
'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Filter out browser extension errors and navigation errors
    if (error.message.includes('Could not establish connection') ||
        error.message.includes('Receiving end does not exist') ||
        error.message.includes('Extension context invalidated') ||
        error.stack?.includes('fetchServerResponse') ||
        error.stack?.includes('createFetch') ||
        error.stack?.includes('navigateReducer')) {
      console.warn('Browser extension or navigation error caught and suppressed:', error.message);
      return { hasError: false }; // Don't show error for extension/navigation issues
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log non-extension errors
    if (!error.message.includes('Could not establish connection')) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please refresh the page to continue
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
// =======
// 'use client';

// import React from 'react';

// interface ErrorBoundaryState {
//   hasError: boolean;
//   error?: Error;
// }

// interface ErrorBoundaryProps {
//   children: React.ReactNode;
//   fallback?: React.ReactNode;
// }

// export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
//   constructor(props: ErrorBoundaryProps) {
//     super(props);
//     this.state = { hasError: false };
//   }

//   static getDerivedStateFromError(error: Error): ErrorBoundaryState {
//     // Filter out browser extension errors and navigation errors
//     if (error.message.includes('Could not establish connection') ||
//         error.message.includes('Receiving end does not exist') ||
//         error.message.includes('Extension context invalidated') ||
//         error.stack?.includes('fetchServerResponse') ||
//         error.stack?.includes('createFetch') ||
//         error.stack?.includes('navigateReducer')) {
//       console.warn('Browser extension or navigation error caught and suppressed:', error.message);
//       return { hasError: false }; // Don't show error for extension/navigation issues
//     }
    
//     return { hasError: true, error };
//   }

//   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
//     // Log non-extension errors
//     if (!error.message.includes('Could not establish connection')) {
//       console.error('Error caught by boundary:', error, errorInfo);
//     }
//   }

//   render() {
//     if (this.state.hasError) {
//       return this.props.fallback || (
//         <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
//           <div className="text-center p-8">
//             <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//               Something went wrong
//             </h2>
//             <p className="text-gray-600 dark:text-gray-400 mb-4">
//               Please refresh the page to continue
//             </p>
//             <button
//               onClick={() => window.location.reload()}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
//             >
//               Refresh Page
//             </button>
//           </div>
//         </div>
//       );
//     }

//     return this.props.children;
//   }
// }
// >>>>>>> 4c6b1f8fa5f1246e7593368e5b4b196e13f9eb3b
