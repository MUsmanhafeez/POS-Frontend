'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeatingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/tables');
  }, [router]);
  return null;
}
