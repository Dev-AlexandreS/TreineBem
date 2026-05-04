import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Treine Bem — Autenticação',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
