"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { useAuth } from "@/hooks/useAuth";
import es from "@/locales/es.json";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState("/");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setRedirectTarget(params.get("redirect") || "/");
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTarget);
    }
  }, [loading, redirectTarget, router, user]);

  const handleSignIn = async () => {
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      router.replace(redirectTarget);
    } catch (err) {
      const message = err instanceof Error ? err.message : es.auth.errorDefault;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-fondo px-4 text-slate-100">
      <section className="w-full max-w-md rounded-xl border border-panelBorde bg-panel/70 p-6">
        <h1 className="mb-6 text-xl font-semibold">{es.auth.loginTitle}</h1>

        <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
          <Input label={es.auth.email} value={email} onChange={setEmail} type="email" />
          <Input label={es.auth.password} value={password} onChange={setPassword} type="password" />

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="space-y-2">
            <Button variant="primary" disabled={submitting} onClick={() => void handleSignIn()}>
              {es.auth.login}
            </Button>
            <Button
              variant="secondary"
              disabled={submitting}
              onClick={() => {
                void signInWithGoogle();
              }}
            >
              {es.auth.google}
            </Button>
          </div>
        </form>

        <p className="mt-5 text-sm text-slate-400">
          <Link href="/register" className="text-acento hover:underline">
            {es.auth.goToRegister}
          </Link>
        </p>
      </section>
    </main>
  );
}
