'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { IUser } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AppLogo from '@/components/ui/AppLogo';

type Tab = 'password' | 'token';

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>('password');
  const [form, setForm] = useState({ email: '', password: '' });
  const [accessToken, setAccessToken] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', form);
      if (res.data.success) {
        setUser(res.data.data.user as IUser);
        toast.success(`Welcome back, ${res.data.data.user.name}!`);
        router.replace('/dashboard');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken.trim()) {
      toast.error('Please enter your access token');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/token-login', { token: accessToken.trim() });
      if (res.data.success) {
        setUser(res.data.data.user as IUser);
        toast.success(`Welcome, ${res.data.data.user.name}!`);
        router.replace('/dashboard');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Invalid access token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <AppLogo size="lg" subtitle="Forge Your Workflow" />
      </div>

      {/* Card */}
      <div
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Tab Switch */}
        <div className="flex border-b border-white/[0.06]">
          {([
            { id: 'password' as Tab, icon: Lock, label: 'Email & Password' },
            { id: 'token' as Tab, icon: Key, label: 'Access Token' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all duration-200 ${
                tab === id
                  ? 'text-white border-b-2 border-violet-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              style={tab === id ? { background: 'rgba(124,58,237,0.07)' } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-7">
          {/* Password Login */}
          {tab === 'password' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Sign in</h2>
                <p className="text-slate-500 text-sm mt-1">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  icon={<Mail className="w-4 h-4" />}
                />

                <div className="relative">
                  <Input
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    icon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-8 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Sign In
                </Button>
              </form>
            </>
          )}

          {/* Token Login */}
          {tab === 'token' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Client Access</h2>
                <p className="text-slate-500 text-sm mt-1">
                  Paste the access token shared by your developer
                </p>
              </div>

              <form onSubmit={handleTokenLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Access Token
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="tf_xxxxxxxxxxxxxxxx..."
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600">
                    Your developer provides this token from the client portal
                  </p>
                </div>

                <Button
                  type="submit"
                  loading={loading}
                  className="w-full mt-2"
                  icon={<Key className="w-4 h-4" />}
                >
                  Access My Portal
                </Button>
              </form>

              <div
                className="mt-5 p-3 rounded-xl"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}
              >
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-violet-300 font-medium">Don&apos;t have a token?</span>{' '}
                  Contact your developer to generate one from your client profile.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
