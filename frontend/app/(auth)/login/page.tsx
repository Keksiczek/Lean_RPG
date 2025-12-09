import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { LoginForm } from '@/components/forms/login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc)] px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Přihlášení</h1>
          <p className="text-sm text-gray-600">Vítejte zpět! Přihlaste se do svého účtu.</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-gray-600">
          Nemáte účet?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Zaregistrujte se
          </Link>
        </p>
      </Card>
    </main>
  );
}
