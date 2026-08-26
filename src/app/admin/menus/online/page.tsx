'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnlineMenusRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/online-menus');
  }, [router]);
  return null;
}
