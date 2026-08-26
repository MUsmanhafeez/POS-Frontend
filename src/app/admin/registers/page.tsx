'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistersRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/pos/registers');
  }, [router]);
  return null;
}
