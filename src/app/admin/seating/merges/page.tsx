'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeatingMergesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/table-merges');
  }, [router]);
  return null;
}
