'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="mb-4">
            <div className="bg-ink-900 dark:bg-cream-50 px-6 py-3 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
              <h1 className="font-display text-4xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                Terms of Service
              </h1>
            </div>
          </div>
          <div className="bg-ink-900 dark:bg-cream-50 px-4 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block">
            <p className="font-body text-sm font-black uppercase tracking-wider text-cream-50 dark:text-ink-900">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2"></div>
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform -rotate-1 space-y-12">
            <section>
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Acceptance of Terms
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  By accessing and using Process ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Description of Service
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  Process is a service that allows users to track and manage job application processes and stages. We provide tools for organizing, analyzing, and sharing information about application processes.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  User Accounts
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 mb-4">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold mb-4">
                  To use certain features of the Service, you must register for an account. When you create an account, you agree to:
                </p>
                <ul className="space-y-3 font-body text-base text-ink-900 dark:text-cream-50 font-bold list-none">
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Provide accurate, current, and complete information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Maintain and promptly update your account information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Maintain the security of your account credentials</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Accept responsibility for all activities under your account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Notify us immediately of any unauthorized use of your account</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  User Conduct
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-4">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="space-y-3 font-body text-base text-ink-900 dark:text-cream-50 font-bold list-none">
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Violate any applicable laws or regulations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Infringe upon the rights of others</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Upload, post, or transmit any content that is harmful, offensive, or illegal</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Attempt to gain unauthorized access to the Service or its related systems</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Interfere with or disrupt the Service or servers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Use automated systems to access the Service without permission</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Impersonate any person or entity</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Collect or store personal data about other users without their consent</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  User Content
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 mb-4">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold mb-4">
                  You retain ownership of any content you create, upload, or store using the Service. By using the Service, you grant us a license to:
                </p>
                <ul className="space-y-3 font-body text-base text-ink-900 dark:text-cream-50 font-bold list-none mb-4">
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Store, process, and display your content as necessary to provide the Service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Use your content to improve and enhance our Service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Back up your content to prevent data loss</span>
                  </li>
                </ul>
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  You are solely responsible for your content and the consequences of posting or sharing it. We reserve the right to remove any content that violates these Terms.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Privacy and Data
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your information.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Intellectual Property
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  The Service and its original content, features, and functionality are owned by Process and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not reproduce, modify, distribute, or create derivative works without our express written permission.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Service Availability
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  We strive to maintain the availability of the Service, but we do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or unforeseen circumstances. We are not liable for any damages resulting from Service unavailability.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Termination
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice, for any breach of these Terms of Service. You may also terminate your account at any time by deleting it through your account settings.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Disclaimer of Warranties
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Limitation of Liability
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  To the maximum extent permitted by law, Process shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Changes to Terms
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Governing Law
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Contact Information
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  If you have any questions about these Terms of Service, please contact us through our feedback page or by email.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
