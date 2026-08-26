'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeatingZonesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/zones');
  }, [router]);
  return null;
}
