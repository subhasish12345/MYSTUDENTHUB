import { LoginForm } from '@/components/auth/login-form';
import { GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="flex flex-col items-center justify-center gap-4 text-center mb-8">
        <Link href="/" className="flex items-center gap-3">
          <GraduationCap className="h-10 w-10 text-primary" />
           <h1 className="font-headline text-4xl font-bold text-primary">MyStudentHub</h1>
        </Link>
        <p className="max-w-md text-muted-foreground">
          Your all-in-one platform for academic success.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
