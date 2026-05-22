'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/appStore';

export default function Home() {
  const router = useRouter();
  const { initFromStorage, user } = useAppStore();

  useEffect(() => {
    initFromStorage();
    const u = useAppStore.getState().user;
    if (u) router.push('/dashboard');
    else router.push('/login');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-50">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading MediFusion...</p>
      </div>
    </div>
  );
}