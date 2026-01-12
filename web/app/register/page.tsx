import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 dark:bg-ink-950">
      <Header />
      <main className="flex-grow flex items-center justify-center bg-cream-50 dark:bg-ink-950 py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm />
      </main>
      <Footer />
    </div>
  );
}

