'use client';

import { Settings } from 'lucide-react';
import SettingsFormShell, { FloatingField, fieldClass } from '@/components/admin/SettingsFormShell';

export default function GeneralSettingsPage() {
  return (
    <SettingsFormShell
      section="general"
      title="General"
      icon={<Settings className="h-5 w-5 text-brand" />}
      defaults={{
        supported_countries: ['Jordan'],
        default_country: 'Jordan',
        supported_locales: ['en', 'ar'],
        default_locale: 'en',
        default_timezone: 'Asia/Amman',
        default_date_format: 'YYYY-MM-DD',
        default_time_format: 'hh:MM AM/PM',
        start_of_week: 'Sunday',
        end_of_week: 'Saturday',
      }}
    >
      {({ form, set }) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <FloatingField label="Supported countries">
            <input
              className={fieldClass}
              value={Array.isArray(form.supported_countries) ? (form.supported_countries as string[]).join(', ') : String(form.supported_countries || '')}
              onChange={(e) => set('supported_countries', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            />
          </FloatingField>
          <FloatingField label="Default country">
            <select className={fieldClass} value={String(form.default_country || 'Jordan')} onChange={(e) => set('default_country', e.target.value)}>
              <option>Jordan</option>
              <option>Pakistan</option>
              <option>UAE</option>
              <option>Saudi Arabia</option>
            </select>
          </FloatingField>
          <FloatingField label="Supported locales">
            <div className={`${fieldClass} flex flex-wrap gap-2`}>
              {(Array.isArray(form.supported_locales) ? (form.supported_locales as string[]) : ['en']).map((locale) => (
                <span key={locale} className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                  {locale === 'en' ? 'English' : locale === 'ar' ? 'Arabic' : locale}
                </span>
              ))}
            </div>
          </FloatingField>
          <FloatingField label="Default Locale">
            <select className={fieldClass} value={String(form.default_locale || 'en')} onChange={(e) => set('default_locale', e.target.value)}>
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </FloatingField>
          <FloatingField label="Default Timezone">
            <select className={fieldClass} value={String(form.default_timezone || 'Asia/Amman')} onChange={(e) => set('default_timezone', e.target.value)}>
              <option>Asia/Amman</option>
              <option>Asia/Karachi</option>
              <option>Asia/Dubai</option>
              <option>Asia/Riyadh</option>
              <option>UTC</option>
            </select>
          </FloatingField>
          <FloatingField label="Default Date Format">
            <select className={fieldClass} value={String(form.default_date_format || 'YYYY-MM-DD')} onChange={(e) => set('default_date_format', e.target.value)}>
              <option>YYYY-MM-DD</option>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
            </select>
          </FloatingField>
          <FloatingField label="Default Time Format">
            <select className={fieldClass} value={String(form.default_time_format || 'hh:MM AM/PM')} onChange={(e) => set('default_time_format', e.target.value)}>
              <option>hh:MM AM/PM</option>
              <option>HH:mm</option>
            </select>
          </FloatingField>
          <FloatingField label="Start of week">
            <select className={fieldClass} value={String(form.start_of_week || 'Sunday')} onChange={(e) => set('start_of_week', e.target.value)}>
              <option>Sunday</option>
              <option>Monday</option>
              <option>Saturday</option>
            </select>
          </FloatingField>
          <FloatingField label="End of week">
            <select className={fieldClass} value={String(form.end_of_week || 'Saturday')} onChange={(e) => set('end_of_week', e.target.value)}>
              <option>Saturday</option>
              <option>Sunday</option>
              <option>Friday</option>
            </select>
          </FloatingField>
        </div>
      )}
    </SettingsFormShell>
  );
}
