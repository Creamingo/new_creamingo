'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

/**
 * Short link redirect: /w/[publicId] → /midnight-wish/wish/[publicId]
 * e.g. creamingo.com/w/abc12 → full wish page
 */
export default function ShortWishRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const publicId = params?.publicId;

  useEffect(() => {
    if (publicId) {
      router.replace(`/midnight-wish/wish/${publicId}`);
    } else {
      router.replace('/midnight-wish');
    }
  }, [publicId, router]);

  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
      <p className="text-gray-400">Opening wish...</p>
    </div>
  );
}
