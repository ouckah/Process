import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Process Tracker. All rights reserved.
          </p>
          <Link href="/feedback" className="text-sm text-gray-500 hover:text-gray-900">
            Feedback
          </Link>
        </div>
      </div>
    </footer>
  );
}

