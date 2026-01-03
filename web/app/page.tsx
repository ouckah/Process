'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MessageSquare, BarChart3, Users, Zap, Shield, ArrowRight, Bot, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: 50 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 50 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />
      <main className="flex-grow bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-center"
            >
              <h1 className="text-5xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-6xl md:text-7xl">
                Track Your Job Process
                <span className="block text-primary-600 dark:text-primary-400 mt-2">From Discord or Web</span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-300 sm:text-2xl"
              >
                The easiest way to keep track of your job applications. Use our Discord bot for quick updates or the web dashboard for detailed insights.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link href="/register">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Get Started Free
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                    Sign In
                  </Button>
                </Link>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                className="mt-6 text-sm text-gray-500 dark:text-gray-400"
              >
                No credit card required • Free forever
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl">
                  Two Ways to Track, One Powerful Platform
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Choose the method that works best for you
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
              {/* Discord Bot Feature */}
              <AnimatedSection>
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-800">
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 text-white">
                    <Bot className="w-7 h-7" />
                  </div>
                  <h3 className="ml-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Discord Bot
                  </h3>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  Track your applications directly from Discord. Quick commands, instant updates, and seamless workflow.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Lightning-fast updates with simple commands</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Privacy controls for your processes</span>
                  </li>
                  <li className="flex items-start">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">View Sankey diagrams and analytics</span>
                  </li>
                </ul>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                  <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
                    <span className="text-indigo-600 dark:text-indigo-400">p!</span>add Google OA
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add a stage in seconds</p>
                </div>
                </div>
              </AnimatedSection>

              {/* Web Dashboard Feature */}
              <AnimatedSection>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 text-white">
                    <Globe className="w-7 h-7" />
                  </div>
                  <h3 className="ml-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Web Dashboard
                  </h3>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  Comprehensive tracking with visualizations, detailed analytics, and full control over your processes.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Interactive Sankey diagrams and analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Timeline visualizations and stage tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Public profiles and sharing options</span>
                  </li>
                </ul>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    📊 Visualize your entire job search journey
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">See patterns and track progress</p>
                </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Core Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AnimatedSection>
                <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-500 text-white mx-auto mb-4">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Easy Tracking</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add stages with simple commands. No complex setup required.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection>
                <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-500 text-white mx-auto mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Community Insights</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Join the community to share and learn from interview experiences.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection>
                <div className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-500 text-white mx-auto mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Interview Insights</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ask questions and get answers from others who've been through similar processes.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="py-20 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-xl border border-primary-200 dark:border-primary-800">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-500 text-white mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl mb-4">
                  Join the Community
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Connect with others going through the job search process. Share interview experiences, get insights, and learn from the community.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <AnimatedSection>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                      Ask Questions
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Get answers about interview processes, company culture, and what to expect at each stage.
                    </p>
                  </div>
                </AnimatedSection>

                <AnimatedSection>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
                      Share Experiences
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Help others by sharing your interview experiences and insights from your job search journey.
                    </p>
                  </div>
                </AnimatedSection>
              </div>

              <div className="text-center">
                <Link href="/register">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Join the Community
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-4xl mb-4">
              Ready to Track Your Job Process?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Start tracking your applications today. Use Discord for quick updates or the web for detailed insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-4">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  Sign In
                </Button>
              </Link>
            </div>
            </div>
          </AnimatedSection>
        </section>
      </main>
      <Footer />
    </div>
  );
}

