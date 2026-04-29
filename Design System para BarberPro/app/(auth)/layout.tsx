import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-2xl backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}