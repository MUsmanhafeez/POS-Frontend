'use client';

import { Mail } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';
import { btnSecondary } from '@/lib/ui';

export default function MailSettingsPage() {
  const { user } = useAuthStore();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  async function sendTestEmail() {
    setTesting(true);
    setTestResult('');
    try {
      await api.post('/settings/mail/test', { to: user?.email });
      setTestResult('Test email sent (or logged in dev mode).');
    } catch (err: unknown) {
      setTestResult(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Test email failed'
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <SettingsFormShell
      section="mail"
      title="Mail"
      icon={<Mail className="h-5 w-5 text-brand" />}
      defaults={{
        mailer: 'SMTP',
        mail_from_address: 'hello@example.com',
        mail_from_name: 'Forkiva',
        mail_host: '127.0.0.1',
        mail_port: '2525',
        mail_username: '',
        mail_password: '',
        mail_encryption: '',
      }}
      banner={
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={btnSecondary} disabled={testing} onClick={sendTestEmail}>
              {testing ? 'Sending…' : 'Send test email'}
            </button>
            <span className="text-sm text-muted">Sends to {user?.email || 'your account email'}</span>
          </div>
          {testResult && <p className="mt-2 text-sm text-foreground">{testResult}</p>}
        </div>
      }
    >
      {({ form, set }) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <FloatingField label="Mailer">
            <select className={fieldClass} value={String(form.mailer || 'SMTP')} onChange={(e) => set('mailer', e.target.value)}>
              <option>SMTP</option>
              <option>Mailgun</option>
              <option>SES</option>
              <option>Log</option>
            </select>
          </FloatingField>
          <FloatingField label="From Address">
            <input className={fieldClass} value={String(form.mail_from_address || '')} onChange={(e) => set('mail_from_address', e.target.value)} />
          </FloatingField>
          <FloatingField label="From Name">
            <input className={fieldClass} value={String(form.mail_from_name || '')} onChange={(e) => set('mail_from_name', e.target.value)} />
          </FloatingField>
          <FloatingField label="Host">
            <input className={fieldClass} value={String(form.mail_host || '')} onChange={(e) => set('mail_host', e.target.value)} />
          </FloatingField>
          <FloatingField label="Port">
            <input className={fieldClass} value={String(form.mail_port || '')} onChange={(e) => set('mail_port', e.target.value)} />
          </FloatingField>
          <FloatingField label="Username">
            <input className={fieldClass} value={String(form.mail_username || '')} onChange={(e) => set('mail_username', e.target.value)} placeholder="Username" />
          </FloatingField>
          <FloatingField label="Password">
            <input type="password" className={fieldClass} value={String(form.mail_password || '')} onChange={(e) => set('mail_password', e.target.value)} placeholder="Password" />
          </FloatingField>
          <FloatingField label="Encryption">
            <select className={fieldClass} value={String(form.mail_encryption || '')} onChange={(e) => set('mail_encryption', e.target.value)}>
              <option value="">None</option>
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
            </select>
          </FloatingField>
        </div>
      )}
    </SettingsFormShell>
  );
}
