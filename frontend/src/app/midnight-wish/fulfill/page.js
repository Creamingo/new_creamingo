'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import MobileFooter from '../../../components/MobileFooter';
import LocationBar from '../../../components/LocationBar';
import { useToast } from '../../../contexts/ToastContext';
import { Heart, Gift } from 'lucide-react';

export default function MidnightWishFulfillPage() {
  const router = useRouter();
  const { showError } = useToast();
  const [linkInput, setLinkInput] = useState('');

  const openWish = () => {
    const raw = linkInput.trim();
    if (!raw) {
      showError('Paste a link', 'Paste the wish link you received');
      return;
    }
    const match =
      raw.match(/\/midnight-wish\/wish\/([a-f0-9]+)/i) ||
      raw.match(/\/w\/([a-f0-9]+)/i) ||
      raw.match(/([a-f0-9]{8,})/);
    const publicId = match ? match[1] : raw;
    if (publicId) router.push(`/midnight-wish/wish/${publicId}`);
    else showError('Invalid link', 'Paste the full wish link');
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] text-gray-100">
      <Header />
      <LocationBar />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,191,36,0.12),transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 via-transparent to-[#0d0d12]" />
        <div className="relative max-w-md mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mb-6">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Fulfill a wish
          </h1>
          <p className="text-gray-400 mb-8">
            Paste the wish link below to see their cakes and buy them.
          </p>

          <div className="text-left mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Wish link
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste the wish link here"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                onClick={openWish}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0d0d12] font-semibold whitespace-nowrap"
              >
                Open wish
              </button>
            </div>
          </div>

          <button
            onClick={() => router.push('/midnight-wish')}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-amber-400 text-sm font-medium transition-colors"
          >
            <Gift className="w-4 h-4" />
            Make my own wish
          </button>
        </div>
      </div>
      <Footer />
      <MobileFooter />
    </div>
  );
}
