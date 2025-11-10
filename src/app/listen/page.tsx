'use client';
import { MicrophoneListen } from '@/app/components/MicrophoneListen';
import PageCard from '@/app/components/PageCard';

export default function ListenPage() {
  return (
    <PageCard>
      <div className="flex justify-center">
        <MicrophoneListen />
      </div>
    </PageCard>
  );
} 
