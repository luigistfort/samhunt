// src/app/login/page.tsx
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Shield, Mail, Github, Chrome, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: '/dashboard' });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading('email');
    const res = await signIn('resend', { email, redirect: false, callbackUrl: '/dashboard' });
    setLoading(null);
    if (res?.ok) setEmailSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 shadow-lg shadow-orange-500/30 mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-100">SAMHunt</h1>
          <p className="text-sm text-zinc-500 mt-1">Government contracts for small business</p>
        </div>

        <div className="card p-6 space-y-4">
          {emailSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="font-display font-bold text-zinc-100 mb-1">Check your email</h2>
              <p className="text-sm text-zinc-400">
                We sent a sign-in link to <span className="text-zinc-200">{email}</span>
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display font-bold text-zinc-100 text-center">Sign in</h2>

              {/* OAuth */}
              <div className="space-y-2">
                <button
                  onClick={() => handleOAuth('google')}
                  disabled={loading !== null}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-200 transition-colors',
                    loading === 'google' && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {loading === 'google' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Chrome className="w-4 h-4" />
                  )}
                  Continue with Google
                </button>
                <button
                  onClick={() => handleOAuth('github')}
                  disabled={loading !== null}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-200 transition-colors',
                    loading === 'github' && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {loading === 'github' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Github className="w-4 h-4" />
                  )}
                  Continue with GitHub
                </button>
              </div>

              <div className="flex items-center gap-3">
                <hr className="flex-1 border-zinc-800" />
                <span className="text-xs text-zinc-600">or</span>
                <hr className="flex-1 border-zinc-800" />
              </div>

              {/* Email */}
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input"
                />
                <button
                  type="submit"
                  disabled={loading !== null || !email.trim()}
                  className={cn(
                    'btn-primary w-full justify-center',
                    (loading !== null || !email.trim()) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {loading === 'email' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Continue with Email
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
