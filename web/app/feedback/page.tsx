'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback</h1>
          <p className="text-gray-600">
            We'd love to hear your thoughts, suggestions, or any issues you've encountered.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <FeedbackForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}

