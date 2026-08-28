import { redirect } from 'next/navigation';

export default function LocalizationRedirectPage() {
  redirect('/admin/translations');
}
