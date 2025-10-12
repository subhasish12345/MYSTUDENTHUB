import { LoginForm } from '@/components/auth/login-form';
import { AnimatedLogo } from '@/components/auth/animated-logo';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Link href="/" className="flex items-center gap-3">
          <AnimatedLogo />
        </Link>
        <p className="max-w-md text-muted-foreground">
          Your all-in-one platform for academic success.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
