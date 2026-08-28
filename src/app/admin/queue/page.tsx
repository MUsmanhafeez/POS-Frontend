'use client';

import { useEffect, useState } from 'react';
import { Ticket } from 'lucide-react';
import api from '@/lib/api';
import { SectionTabs } from '@/components/admin/SectionTabs';
import { TOOLS_TABS } from '@/lib/nav';
import { Card } from '@/components/ui';
import { btnPrimary, fieldClass, labelOf } from '@/lib/ui';

type Token = { id: string; token_number?: number; tokenNumber?: number; status: string };

export default function QueuePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: unknown }>>([]);
  const [branchId, setBranchId] = useState('');

  async function load(bid = branchId) {
    if (!bid) return;
    const { data } = await api.get('/queue/tokens', { params: { branch_id: bid } });
    setTokens(data.body || []);
  }

  useEffect(() => {
    api.get('/branches').then((res) => {
      const list = res.data.body || [];
      setBranches(list);
      if (list[0]) {
        setBranchId(list[0].id);
        load(list[0].id).catch(console.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!branchId) return;
    const t = setInterval(() => load().catch(console.error), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  async function issue() {
    await api.post('/queue/tokens', { branch_id: branchId });
    await load();
  }

  async function call(id: string) {
    await api.post(`/queue/tokens/${id}/call`);
    await load();
  }

  const waiting = tokens.filter((t) => t.status === 'waiting');
  const called = tokens.filter((t) => t.status === 'called');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-plum" />
          <h1 className="text-xl font-bold">Queue / Tokens</h1>
        </div>
        <div className="flex gap-2">
          <select
            className={fieldClass}
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              load(e.target.value).catch(console.error);
            }}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {labelOf(b.name)}
              </option>
            ))}
          </select>
          <button type="button" className={btnPrimary} onClick={issue}>
            Issue token
          </button>
        </div>
      </div>

      <SectionTabs tabs={[...TOOLS_TABS]} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-lg font-semibold">Now serving</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {called.slice(-6).map((t) => (
              <div key={t.id} className="rounded-xl bg-brand px-4 py-6 text-center text-3xl font-bold text-white">
                {t.token_number ?? t.tokenNumber}
              </div>
            ))}
            {!called.length ? <p className="text-sm text-muted">None called</p> : null}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 text-lg font-semibold">Waiting</h2>
          <ul className="space-y-2">
            {waiting.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-xl font-semibold">#{t.token_number ?? t.tokenNumber}</span>
                <button type="button" className="text-sm text-brand" onClick={() => call(t.id)}>
                  Call
                </button>
              </li>
            ))}
            {!waiting.length ? <li className="text-sm text-muted">Queue empty</li> : null}
          </ul>
        </Card>
      </div>
    </div>
  );
}
