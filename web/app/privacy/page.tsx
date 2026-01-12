'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
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
            <div className="bg-ink-900 dark:bg-cream-50 px-6 py-3 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
              <h1 className="font-display text-4xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                Privacy Policy
              </h1>
            </div>
          </div>
          <div className="bg-ink-900 dark:bg-cream-50 px-4 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block">
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
          <div className="relative bg-cream-50 dark:bg-ink-900 border-4 border-ink-900 dark:border-cream-50 p-8 transform rotate-1 space-y-12">
            <section>
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Introduction
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  Process ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Information We Collect
                </h2>
              </div>
              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                  <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
                    <div className="bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-3">
                      <h3 className="font-display text-xl font-black uppercase tracking-tight text-white">
                        Account Information
                      </h3>
                    </div>
                    <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                      When you register for an account, we collect information such as your username, email address, and profile information. If you authenticate through third-party services (such as Discord or Google), we may receive certain information from those services as permitted by their terms.
                    </p>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                  <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1">
                    <div className="bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-3">
                      <h3 className="font-display text-xl font-black uppercase tracking-tight text-white">
                        Process and Application Data
                      </h3>
                    </div>
                    <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                      We store the processes, stages, and application information you create and manage through our service. This data is associated with your account and is used to provide the core functionality of our service.
                    </p>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-1 translate-y-1"></div>
                  <div className="relative bg-cream-100 dark:bg-ink-800 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1">
                    <div className="bg-indigo-600 dark:bg-indigo-500 px-3 py-1 border-2 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-3">
                      <h3 className="font-display text-xl font-black uppercase tracking-tight text-white">
                        Usage Data
                      </h3>
                    </div>
                    <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                      We may collect information about how you interact with our service, including pages visited, features used, and timestamps. This helps us improve our service and user experience.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  How We Use Your Information
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <ul className="space-y-3 font-body text-base text-ink-900 dark:text-cream-50 font-bold list-none">
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>To provide, maintain, and improve our service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>To process your requests and manage your account</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>To communicate with you about your account and our service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>To personalize your experience</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>To analyze usage patterns and improve our service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>To detect, prevent, and address technical issues or security threats</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Data Sharing and Disclosure
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-4">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold mb-4">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>
                <ul className="space-y-3 font-body text-base text-ink-900 dark:text-cream-50 font-bold list-none">
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span><strong>Public Profiles:</strong> If you choose to make your profile public, certain information may be visible to others as you configure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span><strong>Shared Content:</strong> When you share processes using share links, the shared information is accessible to anyone with the link</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span><strong>Service Providers:</strong> We may share information with third-party service providers who assist us in operating our service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Data Security
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Your Rights
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1 mb-4">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold mb-4">
                  You have the right to:
                </p>
                <ul className="space-y-3 font-body text-base text-ink-900 dark:text-cream-50 font-bold list-none">
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Access and review your personal information</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Update or correct your information through your account settings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Delete your account and associated data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Export your data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-ink-900 dark:bg-cream-50 w-2 h-2 border-2 border-ink-900 dark:border-cream-50 mr-3 mt-2 flex-shrink-0"></span>
                    <span>Opt out of certain communications</span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Cookies and Tracking
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  We use cookies and similar technologies to maintain your session, remember your preferences, and improve our service. You can control cookie settings through your browser preferences.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Children's Privacy
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Changes to This Privacy Policy
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </div>
            </section>

            <section className="border-t-4 border-ink-900 dark:border-cream-50 pt-8">
              <div className="bg-ink-900 dark:bg-cream-50 px-4 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 inline-block mb-4">
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-cream-50 dark:text-ink-900">
                  Contact Us
                </h2>
              </div>
              <div className="bg-cream-100 dark:bg-ink-800 px-6 py-4 border-2 border-ink-900 dark:border-cream-50 transform -rotate-1">
                <p className="font-body text-base text-ink-900 dark:text-cream-50 leading-relaxed font-bold">
                  If you have any questions about this Privacy Policy, please contact us through our feedback page or by email.
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
