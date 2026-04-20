export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen page-bg bg-dots flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-sm mx-auto">{children}</div>
    </main>
  );
}
