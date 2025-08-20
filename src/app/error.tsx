'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-4">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We encountered an unexpected error while loading this page.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>
          <a
            href="/"
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Go home
          </a>
        </div>
      </div>
    </div>
  )
}
// =======
// 'use client'

// import { useEffect } from 'react'
// import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

// export default function Error({
//   error,
//   reset,
// }: {
//   error: Error & { digest?: string }
//   reset: () => void
// }) {
//   useEffect(() => {
//     // Log the error to an error reporting service
//     console.error('Route error:', error)
//   }, [error])

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
//       <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-4">
//         <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
//         <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//           Something went wrong!
//         </h2>
//         <p className="text-gray-600 dark:text-gray-400 mb-6">
//           We encountered an unexpected error while loading this page.
//         </p>
//         <div className="space-y-3">
//           <button
//             onClick={reset}
//             className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center"
//           >
//             <RefreshCw className="w-4 h-4 mr-2" />
//             Try again
//           </button>
//           <a
//             href="/"
//             className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors flex items-center justify-center"
//           >
//             <Home className="w-4 h-4 mr-2" />
//             Go home
//           </a>
//         </div>
//       </div>
//     </div>
//   )
// }
// >>>>>>> 4c6b1f8fa5f1246e7593368e5b4b196e13f9eb3b
