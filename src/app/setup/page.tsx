import Link from 'next/link';
import { AlertCircle, ExternalLink, Database } from 'lucide-react';

export default function SupabaseSetupGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <AlertCircle className="w-16 h-16 text-purple-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Supabase Configuration Required
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Please set up your Supabase database to use this application
            </p>
          </div>

          {/* Setup Steps */}
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  1
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Create a Supabase Project
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Go to Supabase and create a new project for your website monitor.
              </p>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Supabase Dashboard
              </a>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  2
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Create the Database Table
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                In your Supabase project, go to the SQL Editor and run this command:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-800 dark:text-gray-200">
{`CREATE TABLE IF NOT EXISTS websites (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  3
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Get Your API Credentials
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                In your Supabase project, go to <strong>Settings → API</strong> and copy:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li><strong>Project URL</strong> (starts with https://...supabase.co)</li>
                <li><strong>Anon public key</strong> (starts with eyJ...)</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                  4
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Update Environment Variables
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create or update your <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">.env.local</code> file 
                in the project root with your actual Supabase credentials:
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-800 dark:text-gray-200">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here`}
                </pre>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> Replace the placeholder values with your actual Supabase credentials.
                  The page will automatically refresh once you save the file.
                </p>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <Database className="w-6 h-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Current Configuration Status
                </h3>
              </div>
              <p className="text-orange-700 dark:text-orange-300">
                The application detected that Supabase is not properly configured. 
                Please follow the steps above to set up your database connection.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center mt-12">
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
