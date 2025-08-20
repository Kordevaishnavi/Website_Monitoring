'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, Website, isSupabaseConfigured as checkSupabaseConfig } from '@/lib/supabase';
import { Plus, Download, Upload, Trash2, ArrowLeft, Database, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import * as Papa from 'papaparse';

export default function URLsPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [configurationError, setConfigurationError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!checkSupabaseConfig()) {
      setConfigurationError(true);
      setError('Supabase is not properly configured. Please check your environment variables.');
      return;
    }
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "websites" does not exist')) {
          setError('Database table not found. Please run the setup SQL in your Supabase project.');
          setConfigurationError(true);
          return;
        }
        throw error;
      }
      setWebsites(data || []);
    } catch (err) {
      console.error('Error fetching websites:', err);
      setError('Failed to load websites. Please check your Supabase configuration.');
      setConfigurationError(true);
    }
  };

  const addWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      // Validate URL format
      let url = newUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const { data, error } = await supabase
        .from('websites')
        .insert([{ url }])
        .select();

      if (error) throw error;
      
      if (data) {
        setWebsites([...data, ...websites]);
        setNewUrl('');
        setSuccess('Website added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error adding website:', err);
      setError('Failed to add website');
    } finally {
      setLoading(false);
    }
  };

  const deleteWebsite = async (id: number) => {
    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setWebsites(websites.filter(w => w.id !== id));
      setSuccess('Website deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting website:', err);
      setError('Failed to delete website');
    }
  };

  const exportToCSV = () => {
    const csvData = websites.map(w => ({
      id: w.id,
      url: w.url,
      created_at: w.created_at
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `websites_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSuccess('CSV exported successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          setLoading(true);
          const urls = results.data
            .map((row: any) => row.url || row.URL)
            .filter(Boolean)
            .map((url: string) => {
              let cleanUrl = url.trim();
              if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                cleanUrl = 'https://' + cleanUrl;
              }
              return { url: cleanUrl };
            });

          if (urls.length === 0) {
            setError('No valid URLs found in CSV file');
            return;
          }

          const { data, error } = await supabase
            .from('websites')
            .insert(urls)
            .select();

          if (error) throw error;
          
          if (data) {
            setWebsites([...data, ...websites]);
            setSuccess(`${data.length} websites imported successfully!`);
            setTimeout(() => setSuccess(''), 3000);
          }
        } catch (err) {
          console.error('Error importing CSV:', err);
          setError('Failed to import CSV');
        } finally {
          setLoading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        setError('Failed to parse CSV file');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            href="/" 
            className="mr-4 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex items-center">
            <Database className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manage Website URLs
            </h1>
          </div>
        </div>

        {/* Configuration Error */}
        {configurationError && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-6 py-4 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <div className="flex-1">
                <h3 className="font-semibold">Supabase Configuration Required</h3>
                <p className="text-sm mt-1">
                  Please set up your Supabase database before using this feature.
                </p>
              </div>
              <Link
                href="/setup"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
              >
                Setup Guide
              </Link>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {error && !configurationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Actions */}
          <div className="space-y-6">
            {/* Add URL Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Add New Website
              </h2>
              <form onSubmit={addWebsite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="example.com or https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                    disabled={configurationError}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || configurationError}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Adding...' : configurationError ? 'Setup Required' : 'Add Website'}
                </button>
              </form>
            </div>

            {/* Import/Export */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Import/Export
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={configurationError}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import from CSV
                </button>
                
                <button
                  onClick={exportToCSV}
                  disabled={websites.length === 0 || configurationError}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to CSV
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={importFromCSV}
                  className="hidden"
                />
              </div>
              
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>CSV format: Each row should have a 'url' column</p>
                <p>Example: url</p>
                <p>google.com</p>
                <p>https://example.com</p>
              </div>
            </div>
          </div>

          {/* Right Column - Website List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Websites ({websites.length})
                </h2>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {configurationError ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">Demo: Website List View</p>
                    <p className="text-sm">Configure Supabase to add and manage websites</p>
                    <div className="mt-6 space-y-3 text-left max-w-sm mx-auto">
                      {/* Demo entries */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-gray-300">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">google.com</p>
                        <p className="text-xs text-gray-400">Demo entry</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-gray-300">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">github.com</p>
                        <p className="text-xs text-gray-400">Demo entry</p>
                      </div>
                    </div>
                  </div>
                ) : websites.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No websites added yet</p>
                    <p className="text-sm">Add your first website to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {websites.map((website) => (
                      <div
                        key={website.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {website.url}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Added: {new Date(website.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteWebsite(website.id)}
                            className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Delete website"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// =======
// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { supabase, Website, isSupabaseConfigured as checkSupabaseConfig } from '@/lib/supabase';
// import { Plus, Download, Upload, Trash2, ArrowLeft, Database, AlertCircle } from 'lucide-react';
// import Link from 'next/link';
// import * as Papa from 'papaparse';

// export default function URLsPage() {
//   const [websites, setWebsites] = useState<Website[]>([]);
//   const [newUrl, setNewUrl] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [configurationError, setConfigurationError] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (!checkSupabaseConfig()) {
//       setConfigurationError(true);
//       setError('Supabase is not properly configured. Please check your environment variables.');
//       return;
//     }
//     fetchWebsites();
//   }, []);

//   const fetchWebsites = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('websites')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) {
//         if (error.message.includes('relation "websites" does not exist')) {
//           setError('Database table not found. Please run the setup SQL in your Supabase project.');
//           setConfigurationError(true);
//           return;
//         }
//         throw error;
//       }
//       setWebsites(data || []);
//     } catch (err) {
//       console.error('Error fetching websites:', err);
//       setError('Failed to load websites. Please check your Supabase configuration.');
//       setConfigurationError(true);
//     }
//   };

//   const addWebsite = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newUrl.trim()) return;

//     setLoading(true);
//     setError('');
    
//     try {
//       // Validate URL format
//       let url = newUrl.trim();
//       if (!url.startsWith('http://') && !url.startsWith('https://')) {
//         url = 'https://' + url;
//       }

//       const { data, error } = await supabase
//         .from('websites')
//         .insert([{ url }])
//         .select();

//       if (error) throw error;
      
//       if (data) {
//         setWebsites([...data, ...websites]);
//         setNewUrl('');
//         setSuccess('Website added successfully!');
//         setTimeout(() => setSuccess(''), 3000);
//       }
//     } catch (err) {
//       console.error('Error adding website:', err);
//       setError('Failed to add website');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteWebsite = async (id: number) => {
//     try {
//       const { error } = await supabase
//         .from('websites')
//         .delete()
//         .eq('id', id);

//       if (error) throw error;
      
//       setWebsites(websites.filter(w => w.id !== id));
//       setSuccess('Website deleted successfully!');
//       setTimeout(() => setSuccess(''), 3000);
//     } catch (err) {
//       console.error('Error deleting website:', err);
//       setError('Failed to delete website');
//     }
//   };

//   const exportToCSV = () => {
//     const csvData = websites.map(w => ({
//       id: w.id,
//       url: w.url,
//       created_at: w.created_at
//     }));

//     const csv = Papa.unparse(csvData);
//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     const url = URL.createObjectURL(blob);
    
//     link.setAttribute('href', url);
//     link.setAttribute('download', `websites_${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     setSuccess('CSV exported successfully!');
//     setTimeout(() => setSuccess(''), 3000);
//   };

//   const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     Papa.parse(file, {
//       header: true,
//       complete: async (results) => {
//         try {
//           setLoading(true);
//           const urls = results.data
//             .map((row: any) => row.url || row.URL)
//             .filter(Boolean)
//             .map((url: string) => {
//               let cleanUrl = url.trim();
//               if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
//                 cleanUrl = 'https://' + cleanUrl;
//               }
//               return { url: cleanUrl };
//             });

//           if (urls.length === 0) {
//             setError('No valid URLs found in CSV file');
//             return;
//           }

//           const { data, error } = await supabase
//             .from('websites')
//             .insert(urls)
//             .select();

//           if (error) throw error;
          
//           if (data) {
//             setWebsites([...data, ...websites]);
//             setSuccess(`${data.length} websites imported successfully!`);
//             setTimeout(() => setSuccess(''), 3000);
//           }
//         } catch (err) {
//           console.error('Error importing CSV:', err);
//           setError('Failed to import CSV');
//         } finally {
//           setLoading(false);
//           if (fileInputRef.current) {
//             fileInputRef.current.value = '';
//           }
//         }
//       },
//       error: (error) => {
//         console.error('CSV parse error:', error);
//         setError('Failed to parse CSV file');
//       }
//     });
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex items-center mb-8">
//           <Link 
//             href="/" 
//             className="mr-4 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
//           >
//             <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
//           </Link>
//           <div className="flex items-center">
//             <Database className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//               Manage Website URLs
//             </h1>
//           </div>
//         </div>

//         {/* Configuration Error */}
//         {configurationError && (
//           <div className="bg-orange-100 border border-orange-400 text-orange-700 px-6 py-4 rounded-lg mb-6">
//             <div className="flex items-center">
//               <AlertCircle className="w-5 h-5 mr-2" />
//               <div className="flex-1">
//                 <h3 className="font-semibold">Supabase Configuration Required</h3>
//                 <p className="text-sm mt-1">
//                   Please set up your Supabase database before using this feature.
//                 </p>
//               </div>
//               <Link
//                 href="/setup"
//                 className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
//               >
//                 Setup Guide
//               </Link>
//             </div>
//           </div>
//         )}

//         {/* Alert Messages */}
//         {error && !configurationError && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
//             {error}
//           </div>
//         )}
        
//         {success && (
//           <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
//             {success}
//           </div>
//         )}

//         <div className="grid lg:grid-cols-3 gap-8">
//           {/* Left Column - Actions */}
//           <div className="space-y-6">
//             {/* Add URL Form */}
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                 Add New Website
//               </h2>
//               <form onSubmit={addWebsite} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                     Website URL
//                   </label>
//                   <input
//                     type="text"
//                     value={newUrl}
//                     onChange={(e) => setNewUrl(e.target.value)}
//                     placeholder="example.com or https://example.com"
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
//                     disabled={configurationError}
//                     required
//                   />
//                 </div>
//                 <button
//                   type="submit"
//                   disabled={loading || configurationError}
//                   className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
//                 >
//                   <Plus className="w-4 h-4 mr-2" />
//                   {loading ? 'Adding...' : configurationError ? 'Setup Required' : 'Add Website'}
//                 </button>
//               </form>
//             </div>

//             {/* Import/Export */}
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
//                 Import/Export
//               </h2>
//               <div className="space-y-3">
//                 <button
//                   onClick={() => fileInputRef.current?.click()}
//                   disabled={configurationError}
//                   className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
//                 >
//                   <Upload className="w-4 h-4 mr-2" />
//                   Import from CSV
//                 </button>
                
//                 <button
//                   onClick={exportToCSV}
//                   disabled={websites.length === 0 || configurationError}
//                   className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
//                 >
//                   <Download className="w-4 h-4 mr-2" />
//                   Export to CSV
//                 </button>
                
//                 <input
//                   ref={fileInputRef}
//                   type="file"
//                   accept=".csv"
//                   onChange={importFromCSV}
//                   className="hidden"
//                 />
//               </div>
              
//               <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
//                 <p>CSV format: Each row should have a 'url' column</p>
//                 <p>Example: url</p>
//                 <p>google.com</p>
//                 <p>https://example.com</p>
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Website List */}
//           <div className="lg:col-span-2">
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
//               <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
//                   Websites ({websites.length})
//                 </h2>
//               </div>
              
//               <div className="max-h-96 overflow-y-auto">
//                 {configurationError ? (
//                   <div className="p-8 text-center text-gray-500 dark:text-gray-400">
//                     <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
//                     <p className="mb-2">Demo: Website List View</p>
//                     <p className="text-sm">Configure Supabase to add and manage websites</p>
//                     <div className="mt-6 space-y-3 text-left max-w-sm mx-auto">
//                       {/* Demo entries */}
//                       <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-gray-300">
//                         <p className="text-sm font-medium text-gray-600 dark:text-gray-300">google.com</p>
//                         <p className="text-xs text-gray-400">Demo entry</p>
//                       </div>
//                       <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-gray-300">
//                         <p className="text-sm font-medium text-gray-600 dark:text-gray-300">github.com</p>
//                         <p className="text-xs text-gray-400">Demo entry</p>
//                       </div>
//                     </div>
//                   </div>
//                 ) : websites.length === 0 ? (
//                   <div className="p-8 text-center text-gray-500 dark:text-gray-400">
//                     <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
//                     <p>No websites added yet</p>
//                     <p className="text-sm">Add your first website to get started</p>
//                   </div>
//                 ) : (
//                   <div className="divide-y divide-gray-200 dark:divide-gray-700">
//                     {websites.map((website) => (
//                       <div
//                         key={website.id}
//                         className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1 min-w-0">
//                             <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
//                               {website.url}
//                             </p>
//                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                               Added: {new Date(website.created_at).toLocaleDateString()}
//                             </p>
//                           </div>
//                           <button
//                             onClick={() => deleteWebsite(website.id)}
//                             className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
//                             title="Delete website"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// >>>>>>> 4c6b1f8fa5f1246e7593368e5b4b196e13f9eb3b
