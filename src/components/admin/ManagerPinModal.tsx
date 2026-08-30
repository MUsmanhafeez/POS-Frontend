'use client';

import { FormEvent, useState } from 'react';
import { Modal } from '@/components/ui';
import { fieldClass } from '@/lib/ui';
import api from '@/lib/api';
import { useT } from '@/stores/locale';

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onVerified: (approver: { id: string; name: string }, pin?: string) => void;
};

export default function ManagerPinModal({ open, title, onClose, onVerified }: Props) {
  const t = useT();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-pin', { pin });
      onVerified({ id: data.body.approver_id, name: data.body.approver_name }, pin);
      setPin('');
      onClose();
    } catch {
      setError(t('Invalid PIN'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={title || t('Manager PIN')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-muted">{t('Enter manager PIN to approve this action.')}</p>
        <input
          className={`${fieldClass} text-center text-2xl tracking-[0.4em]`}
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
        />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={saving || pin.length < 4}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? t('Verifying…') : t('Approve')}
        </button>
      </form>
    </Modal>
  );
}
