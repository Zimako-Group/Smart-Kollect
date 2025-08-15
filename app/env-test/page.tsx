"use client";

import { useEffect, useState } from 'react';

export default function EnvTestPage() {
  const [envStatus, setEnvStatus] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Check if environment variables are defined (client-side)
    // Only check in browser environment to avoid build-time access
    if (typeof window !== 'undefined') {
      const envVars = {
        'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      };
      
      setEnvStatus(envVars);
    }
    
    // Check server-side environment variables
    fetch('/api/env-test')
      .then(res => res.json())
      .then(data => {
        setEnvStatus(prev => ({...prev, ...data}));
      })
      .catch(err => {
        console.error('Error checking server environment variables:', err);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Client-side Environment Variables</h2>
        <ul className="list-disc pl-5">
          {Object.entries(envStatus)
            .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
            .map(([key, isSet]) => (
              <li key={key} className={isSet ? "text-green-600" : "text-red-600"}>
                {key}: {isSet ? "✅ Set" : "❌ Not Set"}
              </li>
            ))}
        </ul>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Server-side Environment Variables</h2>
        <ul className="list-disc pl-5">
          {Object.entries(envStatus)
            .filter(([key]) => !key.startsWith('NEXT_PUBLIC_'))
            .map(([key, isSet]) => (
              <li key={key} className={isSet ? "text-green-600" : "text-red-600"}>
                {key}: {isSet ? "✅ Set" : "❌ Not Set"}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
