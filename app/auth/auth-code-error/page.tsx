// app/auth/auth-code-error/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center bg-white dark:bg-slate-950 p-4">
      <div className="max-w-md space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <span className="text-red-600 dark:text-red-400 text-3xl">✕</span>
        </div>
        
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
          Authentication Error
        </h1>
        
        <p className="text-slate-600 dark:text-slate-400">
          There was a problem signing you in. This often happens if you refresh the page during login.
        </p>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
              {error}
            </p>
          </div>
        )}
        
        <div className="space-y-2 pt-4">
          <Link 
            href="/login" 
            className="block w-full rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700 transition-colors font-medium"
          >
            Try Again
          </Link>
          
          <Link 
            href="/signup" 
            className="block w-full rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
          >
            Create New Account
          </Link>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 pt-4">
          If the problem persists, please try clearing your browser cache and cookies.
        </p>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}