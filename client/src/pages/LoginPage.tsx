import { AxiosError } from "axios";
import { ArrowRight, Mail } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Logo } from "../design-system/Logo";
import { PasswordInput } from "../design-system/PasswordInput";
import { ToastList } from "../design-system/Toast";
import { LoginShowcase } from "../components/auth/LoginShowcase";
import { login } from "../actions/auth.actions";
import { useAuth } from "../hooks/useAuth";
import { loginFormSchema } from "../lib/validators";
import { useUiStore } from "../store/ui.store";

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession, isAuthenticated } = useAuth();
  const pushToast = useUiStore((s) => s.pushToast);
  const [email, setEmail] = useState("admin@signapay.local");
  const [password, setPassword] = useState("Admin123!");
  const [stayOn, setStayOn] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[i.path.join(".")] = i.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await login(email, password);
      setSession(res.token, res.user);
      navigate("/", { replace: true });
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      pushToast("error", ax.response?.data?.message ?? "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative grid min-h-screen grid-cols-1 bg-canvas lg:grid-cols-2">
      {/* Softened seam — a translucent vertical strip that blends the two panes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden w-20 -translate-x-1/2 lg:block"
        style={{
          background:
            "linear-gradient(to right, rgba(246,248,251,0.0) 0%, rgba(246,248,251,0.55) 35%, rgba(14,76,144,0.25) 65%, rgba(14,76,144,0) 100%)",
        }}
      />
      {/* Left pane — form */}
      <div className="relative flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <ToastList className="mb-4" />
          <div className="text-[16px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
            Sign in
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">
            Welcome back.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Review today&rsquo;s authorizations, manage cards, and monitor
            ingestion across every channel. Single sign-in for your SignaPay
            operations team.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-email"
                  className="block text-sm font-medium text-ink"
                >
                  Work email
                </label>
                <span className="text-xs uppercase tracking-wider text-ink-muted">
                  required
                </span>
              </div>
              <div
                className={`flex items-center rounded-[10px] border bg-white focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 focus-within:ring-offset-canvas ${
                  errors.email
                    ? "border-danger"
                    : "border-brand-200 hover:border-brand-400"
                }`}
              >
                <Mail
                  className="ml-3 h-4 w-4 flex-shrink-0 text-ink-muted"
                  aria-hidden
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                  placeholder="name@company.com"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 text-xs text-danger">
                  <span aria-hidden>⚠</span> {errors.email}
                </p>
              )}
            </div>

            <PasswordInput
              id="login-password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              error={errors.password}
            />

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={stayOn}
                onChange={(e) => setStayOn(e.target.checked)}
                className="h-4 w-4 rounded border-brand-200 text-brand-900 focus:ring-brand-600"
              />
              Keep me signed in on this device
            </label>

            <Button
              type="submit"
              className="w-full"
              loading={submitting}
              size="lg"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 rounded-[10px] border border-brand-100 bg-brand-50 p-3 text-xs text-ink-muted">
            <div className="mb-1 font-medium text-ink">Demo credentials</div>
            <div>admin@signapay.local / Admin123!</div>
          </div>
        </div>

        <footer className="mt-auto flex flex-col items-center justify-between gap-2 pt-8 text-xs text-ink-muted sm:flex-row">
          <div>
            &copy; {new Date().getFullYear()} SignaPay &middot; PCI-DSS v4.0
          </div>
        </footer>
      </div>

      {/* Right pane — showcase */}
      <LoginShowcase />
    </div>
  );
}
