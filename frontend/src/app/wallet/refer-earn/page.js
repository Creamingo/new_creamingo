'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ReferAndEarn from '../../../components/ReferAndEarn';

function WalletReferEarnPageContent() {
  const router = useRouter();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-x-hidden w-full max-w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12 pb-32 lg:pb-10 w-full">
          <button
            onClick={() => router.push('/wallet')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Wallet
          </button>

          <div className="mb-5">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Refer & Earn Rewards
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Invite friends, track progress, and unlock cashback in one dedicated place.
            </p>
          </div>

          <ReferAndEarn />
        </div>

        {/* Website Footer - Visually hidden but kept in DOM for SEO */}
        <div className="sr-only">
          <Footer />
        </div>
      </div>
    </>
  );
}

export default function WalletReferEarnPage() {
  return (
    <ProtectedRoute>
      <WalletReferEarnPageContent />
    </ProtectedRoute>
  );
}
