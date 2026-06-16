import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/hooks/useAuth";
import { useAdminLogin } from "@/hooks/useBackend";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Eye, EyeOff, Lock, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAdminAuthenticated, storeAdminSession } = useAdminAuth();
  const adminLoginMutation = useAdminLogin();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if session already valid
  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate({ to: "/admin/dashboard" });
    }
  }, [isAdminAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      const result = await adminLoginMutation.mutateAsync({
        username,
        password,
      });
      storeAdminSession(result.token, result.expiresAt, username);
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid credentials. Please try again.",
      );
    }
  }

  const isLoading = adminLoginMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md space-y-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-display font-bold text-foreground">
              SVGA Book Bank
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              Admin Portal
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div
            className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            data-ocid="admin.login.error_state"
          >
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Login card */}
        <Card className="border-border shadow-md">
          <CardHeader className="pb-2 pt-6 px-6">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-display font-semibold text-foreground">
                Admin Sign In
              </h2>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Enter your administrator credentials to continue.
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-username" className="font-body text-sm">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-username"
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 font-body"
                    autoComplete="username"
                    disabled={isLoading}
                    data-ocid="admin.login.username_input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="font-body text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 font-body"
                    autoComplete="current-password"
                    disabled={isLoading}
                    data-ocid="admin.login.password_input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    data-ocid="admin.login.toggle_password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-body mt-2"
                disabled={isLoading}
                data-ocid="admin.login.submit_button"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-4 bg-sky-50 border border-sky-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                <p className="text-xs text-sky-700 font-body">
                  <span className="font-semibold">Restricted Access.</span> This
                  portal is for authorised SVGA administrators only.
                  Unauthorised access attempts are logged.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Student?{" "}
          <a
            href="/student/login"
            className="text-primary hover:underline font-medium"
          >
            Go to Student Login
          </a>
        </p>

        <footer className="text-center text-sm text-muted-foreground pb-4">
          Made by Devansh Nisar
        </footer>
      </motion.div>
    </div>
  );
}
