'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeatingTablesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/tables');
  }, [router]);
  return null;
}
