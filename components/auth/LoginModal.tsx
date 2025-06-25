// components/auth/LoginModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setRetryCount(0);

    try {
      const result = await login(email, password);
      if (result.success) {
        onClose();
        // The router redirection will be handled by the AuthContext based on user role
      } else {
        // Check if the error is related to rate limiting
        if (result.error && (
          result.error.includes('rate limit') || 
          result.error.includes('429') ||
          result.error.includes('multiple attempts')
        )) {
          setError(`${result.error} The system will automatically retry with increasing delays.`);
          setRetryCount(prev => prev + 1);
        } else {
          setError(result.error || "Invalid email or password. Please try again.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold">
            Welcome Back
          </AlertDialogTitle>
          <AlertDialogDescription>
            Sign in to your account to continue
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant={error.includes('rate limit') || error.includes('retry') ? "warning" : "destructive"} className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {retryCount > 0 && (
          <Alert variant="info" className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <AlertDescription>
              Retry attempt {retryCount}/3. Please wait while we attempt to log you in...
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || retryCount > 0}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Button
                variant="link"
                size="sm"
                className="px-0 font-normal text-xs"
                type="button"
                disabled={isLoading || retryCount > 0}
              >
                Forgot password?
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || retryCount > 0}
            />
          </div>

          <AlertDialogFooter className="flex-col sm:flex-col gap-2 sm:space-x-0">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || retryCount > 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : retryCount > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Button
                variant="link"
                className="p-0 font-normal"
                type="button"
                disabled={isLoading || retryCount > 0}
              >
                Contact administrator
              </Button>
            </div>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}