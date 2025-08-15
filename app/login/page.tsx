'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import Link from 'next/link';

// Component to handle search params with suspense
function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';
  const timeout = searchParams.get('timeout') === 'true';
  const errorParam = searchParams.get('error');
  
  return <LoginContent 
    redirectPath={redirectPath} 
    timeout={timeout} 
    sessionExpired={errorParam === 'session_expired'} 
  />;
}

// Main login content component
function LoginContent({ redirectPath, timeout, sessionExpired }: { redirectPath: string, timeout: boolean, sessionExpired: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Check if user is already logged in - only set redirecting state, let AuthContext handle redirects
  useEffect(() => {
    if (user && !authLoading) {
      console.log('[LOGIN] User already logged in, redirecting');
      setIsRedirecting(true);
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('[LOGIN] Attempting login with email:', email);
      const result = await login(email, password);
      
      if (!result.success) {
        console.log('[LOGIN] Login failed:', result.error);
        setError(result.error || 'Invalid email or password');
        setIsLoading(false);
      }
      // If successful, the useEffect above will handle redirection
    } catch (err) {
      console.error('[LOGIN] Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (isRedirecting || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex items-center">
            <Image 
              src="/logo.png" 
              alt="Zimako Logo" 
              width={48} 
              height={48} 
              className="mr-2"
            />
            <h1 className="text-2xl font-bold text-slate-900">Zimako DCMS</h1>
          </div>
          <p className="text-center text-sm text-slate-600">
            Debt Collection Management System
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeout && (
              <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your session has expired due to inactivity. Please sign in again.
                </AlertDescription>
              </Alert>
            )}
            
            {sessionExpired && (
              <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your session has expired or is invalid. Please sign in again to continue.
                </AlertDescription>
              </Alert>
            )}
            
            {error && (
              <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="border-slate-300"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t bg-slate-50 px-6 py-4">
            <p className="text-xs text-slate-600">
              &copy; {new Date().getFullYear()} Zimako DCMS. All rights reserved.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Main page component with suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <SearchParamsWrapper />
    </Suspense>
  );
}
