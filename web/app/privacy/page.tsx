'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Process ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Account Information</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  When you register for an account, we collect information such as your username, email address, and profile information. If you authenticate through third-party services (such as Discord or Google), we may receive certain information from those services as permitted by their terms.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Process and Application Data</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We store the processes, stages, and application information you create and manage through our service. This data is associated with your account and is used to provide the core functionality of our service.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Usage Data</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We may collect information about how you interact with our service, including pages visited, features used, and timestamps. This helps us improve our service and user experience.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>To provide, maintain, and improve our service</li>
              <li>To process your requests and manage your account</li>
              <li>To communicate with you about your account and our service</li>
              <li>To personalize your experience</li>
              <li>To analyze usage patterns and improve our service</li>
              <li>To detect, prevent, and address technical issues or security threats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Data Sharing and Disclosure</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong>Public Profiles:</strong> If you choose to make your profile public, certain information may be visible to others as you configure</li>
              <li><strong>Shared Content:</strong> When you share processes using share links, the shared information is accessible to anyone with the link</li>
              <li><strong>Service Providers:</strong> We may share information with third-party service providers who assist us in operating our service</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Your Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Access and review your personal information</li>
              <li>Update or correct your information through your account settings</li>
              <li>Delete your account and associated data</li>
              <li>Export your data</li>
              <li>Opt out of certain communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Cookies and Tracking</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We use cookies and similar technologies to maintain your session, remember your preferences, and improve our service. You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us through our feedback page or by email.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
