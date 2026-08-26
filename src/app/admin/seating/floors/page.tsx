'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SeatingFloorsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/floors');
  }, [router]);
  return null;
}
