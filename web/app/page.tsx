'use client';

import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, Bot, Globe, Zap, BarChart3, Shield } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.95, 1], [1, 1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.95, 1], [1, 1, 0.9]);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Process",
    "applicationCategory": "JobApplication",
    "operatingSystem": "Web, Discord",
    "description": "Track job applications and processes with Process - a powerful job tracker with Discord bot integration. Manage your job search, track application stages, and visualize your progress.",
    "url": "https://processes.cc",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Job application tracking",
      "Discord bot integration",
      "Sankey diagram visualization",
      "Timeline tracking",
      "Public profile sharing",
      "Process analytics"
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main className="flex-grow bg-cream-50 dark:bg-ink-950">
        {/* Hero Section - Brutalist Retro-Futuristic */}
        <section ref={heroRef} className="relative overflow-hidden min-h-screen flex items-center">
          {/* Brutalist grid background */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '60px 60px',
              }}
            />
          </div>

          {/* Geometric accent shapes */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-indigo-600 dark:bg-indigo-500 rotate-45 opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-amber-500 dark:bg-amber-400 -rotate-12 opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 border-8 border-indigo-600 dark:border-indigo-400 rotate-12 opacity-5"></div>

          <motion.div
            style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
            className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
          >
            <div className="max-w-5xl">
              {/* Main headline - Brutalist typography */}
              <motion.h1
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-ink-900 dark:text-cream-50 leading-[0.85] mb-8 tracking-tighter"
                style={{ 
                  textShadow: '8px 8px 0px rgba(79, 70, 229, 0.2), -4px -4px 0px rgba(245, 158, 11, 0.1)',
                  WebkitTextStroke: '2px transparent'
                }}
              >
                MASTER
                <br />
                <span className="relative inline-block">
                  YOUR
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="absolute bottom-2 left-0 h-6 bg-gradient-to-r from-indigo-600 to-amber-500 dark:from-indigo-400 dark:to-amber-400 opacity-30 -z-10"
                  />
                </span>
                <br />
                <span className="text-indigo-600 dark:text-indigo-400">PROCESS</span>
              </motion.h1>

              {/* Subheadline - Brutalist style */}
              <motion.p
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="font-body text-xl sm:text-2xl text-ink-700 dark:text-ink-300 leading-tight mb-16 max-w-3xl font-bold"
              >
                Track job applications with brutal efficiency. Discord bot for speed. Web dashboard for depth. The best job application tracker for managing your process.
                <span className="block mt-2 text-indigo-600 dark:text-indigo-400">No compromises.</span>
              </motion.p>

              {/* CTA Buttons - Brutalist design */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex flex-col sm:flex-row gap-6 items-start"
              >
                <Link href="/register">
                  <motion.div
                    whileHover={{ scale: 1.05, x: 4, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
                    <Button 
                      size="lg" 
                      className="relative bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 text-xl font-black border-4 border-ink-900 dark:border-cream-50 transform -rotate-1 group-hover:rotate-0 transition-all duration-200"
                    >
                      <span className="flex items-center">
                        GET STARTED
                        <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </span>
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/login">
                  <motion.div
                    whileHover={{ scale: 1.05, x: 4, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-2 translate-y-2 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="relative px-10 py-5 text-xl font-black border-4 border-ink-900 dark:border-cream-50 bg-cream-50 dark:bg-ink-950 text-ink-900 dark:text-cream-50 transform rotate-1 group-hover:rotate-0 transition-all duration-200"
                    >
                      SIGN IN
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Features Section - Brutalist Cards */}
        <section className="relative py-32 bg-cream-50 dark:bg-ink-950 overflow-hidden">
          {/* Brutalist grid overlay */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px',
              }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section header */}
            <AnimatedSection>
              <div className="mb-24 max-w-4xl">
                <div className="inline-block bg-ink-900 dark:bg-cream-50 px-6 py-2 border-4 border-ink-900 dark:border-cream-50 transform rotate-1 mb-8">
                  <p className="font-body text-xs uppercase tracking-[0.3em] font-black text-cream-50 dark:text-ink-900">
                    Two Interfaces
                  </p>
                </div>
                <h2 className="font-display text-6xl sm:text-7xl md:text-8xl font-black text-ink-900 dark:text-cream-50 leading-tight mb-6 tracking-tighter">
                  CHOOSE YOUR
                  <br />
                  <span className="text-indigo-600 dark:text-indigo-400">WORKFLOW</span>
                </h2>
                <p className="font-body text-xl text-ink-700 dark:text-ink-300 leading-relaxed font-bold max-w-2xl">
                  Job tracker with Discord bot for speed. Web dashboard for depth. Both designed with brutal efficiency.
                </p>
              </div>
            </AnimatedSection>

            {/* Feature Cards - Brutalist Design */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
              {/* Discord Bot Feature */}
              <AnimatedSection delay={0.1}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="relative h-full group"
                >
                  <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform"></div>
                  <div className="relative bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-ink-900 dark:to-indigo-950 border-4 border-ink-900 dark:border-cream-50 p-6 transform -rotate-1 group-hover:rotate-0 transition-transform">
                    <div className="flex items-center mb-5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-1.5 translate-y-1.5"></div>
                        <div className="relative bg-indigo-600 dark:bg-indigo-500 w-14 h-14 border-3 border-ink-900 dark:border-cream-50 flex items-center justify-center">
                          <Bot className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <h3 className="ml-4 font-display text-3xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight">
                        Discord Bot
                      </h3>
                    </div>
                    
                    <p className="font-body text-base text-ink-800 dark:text-ink-200 mb-6 leading-relaxed font-bold">
                      Track job applications directly from Discord. Quick commands. Instant updates. Zero friction. The best Discord bot for job tracking.
                    </p>
                    
                    <ul className="space-y-3 mb-6">
                      {[
                        { icon: Zap, text: 'Lightning-fast updates with simple commands' },
                        { icon: Shield, text: 'Granular privacy controls' },
                        { icon: BarChart3, text: 'Sankey diagrams on demand' },
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="bg-indigo-600 dark:bg-indigo-500 w-7 h-7 border-2 border-ink-900 dark:border-cream-50 flex items-center justify-center mr-3 flex-shrink-0">
                            <item.icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="font-body text-sm text-ink-800 dark:text-ink-200 font-semibold">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="bg-ink-900 dark:bg-cream-50 border-3 border-indigo-600 dark:border-indigo-400 p-4 transform rotate-1 mb-4">
                      <p className="font-mono text-sm text-indigo-300 dark:text-indigo-700 mb-1 font-bold">
                        <span className="text-amber-500 dark:text-amber-600">p!</span>add Google OA
                      </p>
                      <p className="font-body text-xs text-indigo-200 dark:text-indigo-800 uppercase tracking-wider font-black">
                        Add a job application stage in seconds with the Processes Discord bot
                      </p>
                    </div>
                    
                    <motion.a
                      href="https://discord.com/oauth2/authorize?client_id=1455729068174737419&permissions=2147551232&integration_type=0&scope=bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative block group"
                    >
                      <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
                      <div className="relative bg-indigo-600 dark:bg-indigo-500 px-5 py-3 border-3 border-ink-900 dark:border-cream-50 transform -rotate-1 group-hover:rotate-0 transition-transform flex items-center justify-center gap-2">
                        <Bot className="w-4 h-4 text-white" />
                        <span className="font-body text-base font-black uppercase tracking-wider text-white">
                          Add to Discord
                        </span>
                      </div>
                    </motion.a>
                  </div>
                </motion.div>
              </AnimatedSection>

              {/* Web Dashboard Feature */}
              <AnimatedSection delay={0.2}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="relative h-full group"
                >
                  <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform"></div>
                  <div className="relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-ink-900 dark:to-amber-950 border-4 border-ink-900 dark:border-cream-50 p-6 transform rotate-1 group-hover:rotate-0 transition-transform">
                    <div className="flex items-center mb-5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-600 dark:bg-amber-500 translate-x-1.5 translate-y-1.5"></div>
                        <div className="relative bg-amber-600 dark:bg-amber-500 w-14 h-14 border-3 border-ink-900 dark:border-cream-50 flex items-center justify-center">
                          <Globe className="w-7 h-7 text-white" />
                        </div>
                      </div>
                      <h3 className="ml-4 font-display text-3xl font-black text-ink-900 dark:text-cream-50 uppercase tracking-tight">
                        Web Dashboard
                      </h3>
                    </div>
                    
                    <p className="font-body text-base text-ink-800 dark:text-ink-200 mb-6 leading-relaxed font-bold">
                      Comprehensive job application tracking with visualizations. Detailed analytics. Full control. Track your entire job search process.
                    </p>
                    
                    <ul className="space-y-3 mb-6">
                      {[
                        { icon: BarChart3, text: 'Interactive Sankey diagrams' },
                        { icon: Zap, text: 'Timeline visualizations' },
                        { icon: Shield, text: 'Public profiles & sharing' },
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="bg-amber-600 dark:bg-amber-500 w-7 h-7 border-2 border-ink-900 dark:border-cream-50 flex items-center justify-center mr-3 flex-shrink-0">
                            <item.icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="font-body text-sm text-ink-800 dark:text-ink-200 font-semibold">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="bg-ink-900 dark:bg-cream-50 border-3 border-amber-600 dark:border-amber-400 p-4 transform -rotate-1 mb-4">
                      <p className="font-body text-sm text-amber-200 dark:text-amber-800 mb-1 font-black uppercase">
                        📊 Visualize your entire journey
                      </p>
                      <p className="font-body text-xs text-amber-300 dark:text-amber-700 uppercase tracking-wider font-bold">
                        See patterns. Track progress.
                      </p>
                    </div>
                    
                    <motion.a
                      href="/register"
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative block group"
                    >
                      <div className="absolute inset-0 bg-amber-600 dark:bg-amber-500 translate-x-1.5 translate-y-1.5 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform"></div>
                      <div className="relative bg-amber-600 dark:bg-amber-500 px-5 py-3 border-3 border-ink-900 dark:border-cream-50 transform rotate-1 group-hover:rotate-0 transition-transform flex items-center justify-center gap-2">
                        <Globe className="w-4 h-4 text-white" />
                        <span className="font-body text-base font-black uppercase tracking-wider text-white">
                          Start Tracking Now
                        </span>
                      </div>
                    </motion.a>
                  </div>
                </motion.div>
              </AnimatedSection>
            </div>

            {/* Final CTA */}
            <AnimatedSection delay={0.3}>
              <div className="text-center">
                <Link href="/register">
                  <motion.div
                    whileHover={{ scale: 1.05, x: 4, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block relative group"
                  >
                    <div className="absolute inset-0 bg-ink-900 dark:bg-cream-50 translate-x-3 translate-y-3 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform"></div>
                    <Button 
                      size="lg" 
                      className="relative bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-6 text-2xl font-black border-4 border-ink-900 dark:border-cream-50 transform rotate-1 group-hover:rotate-0 transition-all"
                    >
                      START TRACKING NOW
                      <ArrowRight className="ml-4 w-6 h-6 inline" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
