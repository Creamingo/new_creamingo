'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Upload,
  X,
  Sparkles,
  Send,
  Image as ImageIcon
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import MobileFooter from '../../../components/MobileFooter';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { useToast } from '../../../contexts/ToastContext';

const FEEDBACK_TOPICS = [
  'Quality',
  'Service',
  'Product',
  'Design',
  'Delivery',
  'App experience',
  'Website experience',
  'Suggestion'
];

function FeedbackPageContent() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imagePreviews = useMemo(
    () =>
      images.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      })),
    [images]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl);
        } catch {
          // Ignore cleanup errors
        }
      });
    };
  }, [imagePreviews]);

  const handleToggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((item) => item !== topic) : [...prev, topic]
    );
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      showError('Only images allowed', 'Please upload image files only.');
    }

    const total = images.length + imageFiles.length;
    if (total > 4) {
      showError('Maximum 4 images', 'You can upload up to 4 images.');
      return;
    }

    const oversized = imageFiles.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      showError('Image too large', 'Each image should be under 5MB.');
      return;
    }

    setImages((prev) => [...prev, ...imageFiles]);
    event.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!feedbackText.trim()) {
      showError('Feedback required', 'Please share your feedback before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);

      // TODO: Hook this payload to a dedicated feedback API endpoint.
      // For now, we capture user feedback input and acknowledge submission.
      const payload = {
        topics: selectedTopics,
        message: feedbackText.trim(),
        imageCount: images.length
      };
      console.info('Feedback payload:', payload);

      await new Promise((resolve) => setTimeout(resolve, 700));

      setSelectedTopics([]);
      setFeedbackText('');
      setImages([]);
      showSuccess('Feedback submitted', 'Thank you! Your suggestions help us improve.');
    } catch (error) {
      console.error('Feedback submit error:', error);
      showError('Submission failed', 'Please try again in a moment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div
          className="fixed left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200/60 dark:border-gray-700/60"
          style={{ top: '0' }}
        >
          <div className="max-w-4xl mx-auto px-4 py-2.5">
            <button
              type="button"
              onClick={() => router.push('/account')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-2 lg:pt-3 pb-24">
          <div className="rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white dark:bg-gray-800 shadow-sm p-4 sm:p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-800 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-pink-600 dark:text-pink-300" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Your Feedback
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  Share suggestions on quality, service, products, delivery, app or website experience.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  What is this feedback about?
                </p>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleToggleTopic(topic)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-900/35 dark:text-pink-300 dark:border-pink-700'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-700/60 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Your feedback
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(event) => setFeedbackText(event.target.value)}
                  placeholder="Tell us what can be improved..."
                  rows={5}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Upload images (optional)
                </label>
                <div className="rounded-xl border border-dashed border-pink-300 dark:border-pink-700 bg-pink-50/40 dark:bg-pink-900/15 p-3">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-700 text-sm font-medium text-pink-700 dark:text-pink-300 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/25 transition-colors">
                    <Upload className="w-4 h-4" />
                    Choose images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Up to 4 images, max 5MB each.
                  </p>

                  {imagePreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {imagePreviews.map((item, index) => (
                        <div key={`${item.file.name}-${index}`} className="relative group">
                          <img
                            src={item.previewUrl}
                            alt={`Feedback upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white opacity-90 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Your feedback directly helps us improve quality, service, and user experience.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white py-2.5 font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>

        <div className="sr-only">
          <Footer />
        </div>
        <MobileFooter />
      </div>
    </>
  );
}

export default function FeedbackPage() {
  return (
    <ProtectedRoute>
      <FeedbackPageContent />
    </ProtectedRoute>
  );
}
