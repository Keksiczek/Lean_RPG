import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { RegisterForm } from '@/components/forms/register-form';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc)] px-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Vytvořit účet</h1>
          <p className="text-sm text-gray-600">Zaregistrujte se a začněte svou výpravu.</p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-gray-600">
          Máte již účet?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Přihlaste se
          </Link>
        </p>
      </Card>
    </main>
  );
}
