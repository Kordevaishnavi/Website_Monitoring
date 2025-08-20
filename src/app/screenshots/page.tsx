'use client';

import { useState, useEffect } from 'react';
import { supabase, Website } from '@/lib/supabase';
import { Camera, ArrowLeft, Globe, AlertCircle, CheckCircle, XCircle, Clock, Shield, ShieldAlert, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type ScreenshotStatus = {
  id: number;
  url: string;
  screenshot_path?: string;
  status: 'up' | 'down' | 'error' | 'checking';
  ssl_valid: boolean;
  ssl_expires?: string;
  ssl_days_remaining?: number;
  ssl_issued_date?: string;
  response_time?: number;
  error_message?: string;
};

export default function ScreenshotsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotStatus | null>(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (err) {
      console.error('Error fetching websites:', err);
      setError('Failed to load websites');
    }
  };

  const generateScreenshots = async () => {
    if (websites.length === 0) {
      setError('No websites to process. Add some URLs first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    // Initialize screenshots with checking status
    const initialScreenshots: ScreenshotStatus[] = websites.map(w => ({
      id: w.id,
      url: w.url,
      status: 'checking' as const,
      ssl_valid: false
    }));
    setScreenshots(initialScreenshots);

    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websites }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results: ScreenshotStatus[] = await response.json();
      setScreenshots(results);
      setSuccess(`Processed ${results.length} websites successfully!`);
    } catch (err) {
      console.error('Error generating screenshots:', err);
      setError('Failed to generate screenshots. Make sure the API is working.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: ScreenshotStatus['status']) => {
    switch (status) {
      case 'up':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getStatusColor = (status: ScreenshotStatus['status']) => {
    switch (status) {
      case 'up':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'down':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'checking':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="mr-4 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <div className="flex items-center">
              <Camera className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Screenshots & Monitoring
              </h1>
            </div>
          </div>
          
          <button
            onClick={generateScreenshots}
            disabled={loading || websites.length === 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center"
          >
            <Camera className="w-4 h-4 mr-2" />
            {loading ? 'Processing...' : 'Generate Screenshots'}
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Statistics */}
        {screenshots.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {screenshots.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {screenshots.filter(s => s.status === 'up').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Online</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {screenshots.filter(s => s.status === 'down' || s.status === 'error').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Offline</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {screenshots.filter(s => s.ssl_valid).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">SSL Valid</div>
            </div>
          </div>
        )}

        {/* Screenshots Grid */}
        {websites.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Websites Added
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add some website URLs first to generate screenshots
            </p>
            <Link
              href="/urls"
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
            >
              <Globe className="w-4 h-4 mr-2" />
              Manage URLs
            </Link>
          </div>
        ) : screenshots.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Ready to Generate Screenshots
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click the "Generate Screenshots" button to capture website previews and check their status
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found {websites.length} website{websites.length !== 1 ? 's' : ''} to process
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {screenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 ${getStatusColor(screenshot.status)}`}
              >
                {/* Screenshot Image */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative group">
                  {screenshot.screenshot_path ? (
                    <div 
                      className="relative w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedScreenshot(screenshot)}
                    >
                      <Image
                        src={screenshot.screenshot_path}
                        alt={`Screenshot of ${screenshot.url}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/error.svg';
                        }}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                            <ExternalLink className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {screenshot.status === 'checking' ? (
                        <div className="text-center">
                          <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500 animate-spin" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Processing...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">No screenshot</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Website Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                      {screenshot.url}
                    </h3>
                    <div className="flex items-center space-x-1 ml-2">
                      {getStatusIcon(screenshot.status)}
                      {screenshot.ssl_valid ? (
                        <Shield className="w-4 h-4 text-green-500" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`font-medium ${
                        screenshot.status === 'up' ? 'text-green-600' : 
                        screenshot.status === 'down' ? 'text-red-600' : 
                        screenshot.status === 'checking' ? 'text-yellow-600' : 'text-orange-600'
                      }`}>
                        {screenshot.status === 'checking' ? 'Checking...' : 
                         screenshot.status === 'up' ? 'Online' : 
                         screenshot.status === 'down' ? 'Offline' : 'Error'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">SSL:</span>
                      <span className={`font-medium ${screenshot.ssl_valid ? 'text-green-600' : 'text-orange-600'}`}>
                        {screenshot.ssl_valid ? 'Valid' : 'Invalid/None'}
                      </span>
                    </div>

                    {screenshot.response_time && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Response:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {screenshot.response_time}ms
                        </span>
                      </div>
                    )}

                    {/* SSL Certificate Details */}
                    {screenshot.ssl_expires && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">SSL Expires:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(screenshot.ssl_expires).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {screenshot.ssl_days_remaining !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Days Left:</span>
                        <span className={`font-medium ${
                          screenshot.ssl_days_remaining > 50 ? 'text-green-600' : 
                          screenshot.ssl_days_remaining > 40 ? 'text-yellow-500' : 'text-red-600'
                        }`}>
                          {screenshot.ssl_days_remaining > 0 ? `${screenshot.ssl_days_remaining} days` : 'Expired'}
                        </span>
                      </div>
                    )}

                    {screenshot.ssl_issued_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">SSL Issued:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(screenshot.ssl_issued_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {screenshot.error_message && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-700 dark:text-red-400 text-xs">
                        {screenshot.error_message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot && selectedScreenshot.screenshot_path && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="relative max-w-7xl max-h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedScreenshot.status)}
                  {selectedScreenshot.ssl_valid ? (
                    <Shield className="w-4 h-4 text-green-500" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedScreenshot.url}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedScreenshot.status === 'up' ? 'Online' : 
                     selectedScreenshot.status === 'down' ? 'Offline' : 'Error'} • 
                    {selectedScreenshot.response_time}ms • 
                    SSL {selectedScreenshot.ssl_valid ? 'Valid' : 'Invalid'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={selectedScreenshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="Visit website"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            <div className="relative">
              <Image
                src={selectedScreenshot.screenshot_path}
                alt={`Full screenshot of ${selectedScreenshot.url}`}
                width={1920}
                height={1080}
                className="max-w-full max-h-[80vh] object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// =======
// 'use client';

// import { useState, useEffect } from 'react';
// import { supabase, Website } from '@/lib/supabase';
// import { Camera, ArrowLeft, Globe, AlertCircle, CheckCircle, XCircle, Clock, Shield, ShieldAlert, X, ExternalLink } from 'lucide-react';
// import Link from 'next/link';
// import Image from 'next/image';

// type ScreenshotStatus = {
//   id: number;
//   url: string;
//   screenshot_path?: string;
//   status: 'up' | 'down' | 'error' | 'checking';
//   ssl_valid: boolean;
//   response_time?: number;
//   error_message?: string;
// };

// export default function ScreenshotsPage() {
//   const [websites, setWebsites] = useState<Website[]>([]);
//   const [screenshots, setScreenshots] = useState<ScreenshotStatus[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotStatus | null>(null);

//   useEffect(() => {
//     fetchWebsites();
//   }, []);

//   const fetchWebsites = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('websites')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       setWebsites(data || []);
//     } catch (err) {
//       console.error('Error fetching websites:', err);
//       setError('Failed to load websites');
//     }
//   };

//   const generateScreenshots = async () => {
//     if (websites.length === 0) {
//       setError('No websites to process. Add some URLs first.');
//       return;
//     }

//     setLoading(true);
//     setError('');
//     setSuccess('');
    
//     // Initialize screenshots with checking status
//     const initialScreenshots: ScreenshotStatus[] = websites.map(w => ({
//       id: w.id,
//       url: w.url,
//       status: 'checking' as const,
//       ssl_valid: false
//     }));
//     setScreenshots(initialScreenshots);

//     try {
//       const response = await fetch('/api/screenshot', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ websites }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const results: ScreenshotStatus[] = await response.json();
//       setScreenshots(results);
//       setSuccess(`Processed ${results.length} websites successfully!`);
//     } catch (err) {
//       console.error('Error generating screenshots:', err);
//       setError('Failed to generate screenshots. Make sure the API is working.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusIcon = (status: ScreenshotStatus['status']) => {
//     switch (status) {
//       case 'up':
//         return <CheckCircle className="w-5 h-5 text-green-500" />;
//       case 'down':
//         return <XCircle className="w-5 h-5 text-red-500" />;
//       case 'checking':
//         return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
//       default:
//         return <AlertCircle className="w-5 h-5 text-orange-500" />;
//     }
//   };

//   const getStatusColor = (status: ScreenshotStatus['status']) => {
//     switch (status) {
//       case 'up':
//         return 'border-green-500 bg-green-50 dark:bg-green-900/20';
//       case 'down':
//         return 'border-red-500 bg-red-50 dark:bg-red-900/20';
//       case 'checking':
//         return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
//       default:
//         return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div className="flex items-center">
//             <Link 
//               href="/" 
//               className="mr-4 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
//             >
//               <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
//             </Link>
//             <div className="flex items-center">
//               <Camera className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
//               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//                 Screenshots & Monitoring
//               </h1>
//             </div>
//           </div>
          
//           <button
//             onClick={generateScreenshots}
//             disabled={loading || websites.length === 0}
//             className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center"
//           >
//             <Camera className="w-4 h-4 mr-2" />
//             {loading ? 'Processing...' : 'Generate Screenshots'}
//           </button>
//         </div>

//         {/* Alert Messages */}
//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
//             {error}
//           </div>
//         )}
        
//         {success && (
//           <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
//             {success}
//           </div>
//         )}

//         {/* Statistics */}
//         {screenshots.length > 0 && (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//             <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
//               <div className="text-2xl font-bold text-gray-900 dark:text-white">
//                 {screenshots.length}
//               </div>
//               <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
//             </div>
//             <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
//               <div className="text-2xl font-bold text-green-600">
//                 {screenshots.filter(s => s.status === 'up').length}
//               </div>
//               <div className="text-sm text-gray-500 dark:text-gray-400">Online</div>
//             </div>
//             <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
//               <div className="text-2xl font-bold text-red-600">
//                 {screenshots.filter(s => s.status === 'down' || s.status === 'error').length}
//               </div>
//               <div className="text-sm text-gray-500 dark:text-gray-400">Offline</div>
//             </div>
//             <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
//               <div className="text-2xl font-bold text-green-600">
//                 {screenshots.filter(s => s.ssl_valid).length}
//               </div>
//               <div className="text-sm text-gray-500 dark:text-gray-400">SSL Valid</div>
//             </div>
//           </div>
//         )}

//         {/* Screenshots Grid */}
//         {websites.length === 0 ? (
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
//             <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//             <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
//               No Websites Added
//             </h2>
//             <p className="text-gray-600 dark:text-gray-400 mb-6">
//               Add some website URLs first to generate screenshots
//             </p>
//             <Link
//               href="/urls"
//               className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors inline-flex items-center"
//             >
//               <Globe className="w-4 h-4 mr-2" />
//               Manage URLs
//             </Link>
//           </div>
//         ) : screenshots.length === 0 ? (
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
//             <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//             <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
//               Ready to Generate Screenshots
//             </h2>
//             <p className="text-gray-600 dark:text-gray-400 mb-6">
//               Click the "Generate Screenshots" button to capture website previews and check their status
//             </p>
//             <p className="text-sm text-gray-500 dark:text-gray-400">
//               Found {websites.length} website{websites.length !== 1 ? 's' : ''} to process
//             </p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {screenshots.map((screenshot) => (
//               <div
//                 key={screenshot.id}
//                 className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 ${getStatusColor(screenshot.status)}`}
//               >
//                 {/* Screenshot Image */}
//                 <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative group">
//                   {screenshot.screenshot_path ? (
//                     <div 
//                       className="relative w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
//                       onClick={() => setSelectedScreenshot(screenshot)}
//                     >
//                       <Image
//                         src={screenshot.screenshot_path}
//                         alt={`Screenshot of ${screenshot.url}`}
//                         fill
//                         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
//                         className="object-cover"
//                         onError={(e) => {
//                           const target = e.target as HTMLImageElement;
//                           target.src = '/error.svg';
//                         }}
//                       />
//                       {/* Hover overlay */}
//                       <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
//                         <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//                           <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
//                             <ExternalLink className="w-5 h-5 text-gray-700 dark:text-gray-300" />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="absolute inset-0 flex items-center justify-center">
//                       {screenshot.status === 'checking' ? (
//                         <div className="text-center">
//                           <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500 animate-spin" />
//                           <p className="text-sm text-gray-600 dark:text-gray-400">Processing...</p>
//                         </div>
//                       ) : (
//                         <div className="text-center">
//                           <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
//                           <p className="text-sm text-gray-600 dark:text-gray-400">No screenshot</p>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Website Info */}
//                 <div className="p-4">
//                   <div className="flex items-start justify-between mb-3">
//                     <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
//                       {screenshot.url}
//                     </h3>
//                     <div className="flex items-center space-x-1 ml-2">
//                       {getStatusIcon(screenshot.status)}
//                       {screenshot.ssl_valid ? (
//                         <Shield className="w-4 h-4 text-green-500" />
//                       ) : (
//                         <ShieldAlert className="w-4 h-4 text-orange-500" />
//                       )}
//                     </div>
//                   </div>

//                   <div className="space-y-2 text-xs">
//                     <div className="flex justify-between">
//                       <span className="text-gray-500 dark:text-gray-400">Status:</span>
//                       <span className={`font-medium ${
//                         screenshot.status === 'up' ? 'text-green-600' : 
//                         screenshot.status === 'down' ? 'text-red-600' : 
//                         screenshot.status === 'checking' ? 'text-yellow-600' : 'text-orange-600'
//                       }`}>
//                         {screenshot.status === 'checking' ? 'Checking...' : 
//                          screenshot.status === 'up' ? 'Online' : 
//                          screenshot.status === 'down' ? 'Offline' : 'Error'}
//                       </span>
//                     </div>

//                     <div className="flex justify-between">
//                       <span className="text-gray-500 dark:text-gray-400">SSL:</span>
//                       <span className={`font-medium ${screenshot.ssl_valid ? 'text-green-600' : 'text-orange-600'}`}>
//                         {screenshot.ssl_valid ? 'Valid' : 'Invalid/None'}
//                       </span>
//                     </div>

//                     {screenshot.response_time && (
//                       <div className="flex justify-between">
//                         <span className="text-gray-500 dark:text-gray-400">Response:</span>
//                         <span className="font-medium text-gray-900 dark:text-white">
//                           {screenshot.response_time}ms
//                         </span>
//                       </div>
//                     )}

//                     {screenshot.error_message && (
//                       <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-700 dark:text-red-400 text-xs">
//                         {screenshot.error_message}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Screenshot Modal */}
//       {selectedScreenshot && selectedScreenshot.screenshot_path && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
//           <div className="relative max-w-7xl max-h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
//             {/* Modal Header */}
//             <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
//               <div className="flex items-center space-x-3">
//                 <div className="flex items-center space-x-2">
//                   {getStatusIcon(selectedScreenshot.status)}
//                   {selectedScreenshot.ssl_valid ? (
//                     <Shield className="w-4 h-4 text-green-500" />
//                   ) : (
//                     <ShieldAlert className="w-4 h-4 text-orange-500" />
//                   )}
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900 dark:text-white">
//                     {selectedScreenshot.url}
//                   </h3>
//                   <p className="text-sm text-gray-500 dark:text-gray-400">
//                     {selectedScreenshot.status === 'up' ? 'Online' : 
//                      selectedScreenshot.status === 'down' ? 'Offline' : 'Error'} • 
//                     {selectedScreenshot.response_time}ms • 
//                     SSL {selectedScreenshot.ssl_valid ? 'Valid' : 'Invalid'}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <a
//                   href={selectedScreenshot.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
//                   title="Visit website"
//                 >
//                   <ExternalLink className="w-5 h-5" />
//                 </a>
//                 <button
//                   onClick={() => setSelectedScreenshot(null)}
//                   className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>

//             {/* Modal Image */}
//             <div className="relative">
//               <Image
//                 src={selectedScreenshot.screenshot_path}
//                 alt={`Full screenshot of ${selectedScreenshot.url}`}
//                 width={1920}
//                 height={1080}
//                 className="max-w-full max-h-[80vh] object-contain"
//                 priority
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
// >>>>>>> 4c6b1f8fa5f1246e7593368e5b4b196e13f9eb3b
