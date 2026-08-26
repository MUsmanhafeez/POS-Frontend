'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [identifier, setIdentifier] = useState('admin@forkiva.app');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(identifier, password);
      router.push('/admin');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.25),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.2),_transparent_40%),#eef6f4] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-teal-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-lg font-bold text-white shadow-sm">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-[0.14em] text-slate-900">FORKIVA</h1>
          <p className="mt-2 text-sm font-medium text-slate-600">Welcome to Forkiva Restaurant POS</p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700">{error}</div>
        )}
        <label className="mb-1 block text-sm font-semibold text-slate-800">Email or username</label>
        <input
          className="mb-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <label className="mb-1 block text-sm font-semibold text-slate-800">Password</label>
        <input
          type="password"
          className="mb-6 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          disabled={loading}
          className="btn-solid w-full rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-2.5 font-bold !text-white shadow-sm transition hover:from-teal-700 hover:to-emerald-700 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
