"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase, debugSupabaseClient, checkSupabaseConnection } from '@/lib/supabase';

export default function SupabaseConnectionTest() {
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [configDetails, setConfigDetails] = useState<any>(null);

  const testConnection = async () => {
    setLoading(true);
    setConnectionStatus('untested');
    setErrorDetails(null);
    
    try {
      // Get config details first
      const config = debugSupabaseClient();
      setConfigDetails(config);
      
      // Test database connection directly
      console.log('Testing database connection...');
      const connectionResult = await checkSupabaseConnection();
      
      if (!connectionResult) {
        setConnectionStatus('error');
        setErrorDetails('Failed to connect to Supabase database. Check your SUPABASE_URL and RLS policies.');
        setLoading(false);
        return;
      }
      
      // All tests passed
      setConnectionStatus('success');
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus('error');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Verify your connection to Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connectionStatus === 'untested' && loading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Testing connection...</span>
          </div>
        )}
        
        {connectionStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Connection Successful</AlertTitle>
            <AlertDescription className="text-green-700">
              Your application is properly connected to Supabase.
            </AlertDescription>
          </Alert>
        )}
        
        {connectionStatus === 'error' && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Connection Failed</AlertTitle>
            <AlertDescription className="text-red-700">
              {errorDetails || 'Could not connect to Supabase. Check your environment variables.'}
            </AlertDescription>
          </Alert>
        )}
        
        {configDetails && (
          <div className="mt-4 p-3 border rounded bg-gray-50 text-sm">
            <h4 className="font-medium mb-2">Configuration Details:</h4>
            <ul className="space-y-1">
              <li>
                <span className="font-medium">URL:</span> 
                {configDetails.url ? (
                  <span className="ml-1">{configDetails.url.substring(0, 20)}...</span>
                ) : (
                  <span className="ml-1 text-red-500">Missing</span>
                )}
              </li>
              <li>
                <span className="font-medium">API Key:</span> 
                {configDetails.keyPresent ? (
                  <span className="ml-1">Present (Length: {configDetails.keyLength})</span>
                ) : (
                  <span className="ml-1 text-red-500">Missing</span>
                )}
              </li>
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={testConnection} 
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Testing...' : 'Test Connection Again'}
        </Button>
      </CardFooter>
    </Card>
  );
}
