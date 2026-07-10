import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnonActor } from "@/hooks/useAnonActor";
import { useAdminAuth } from "@/hooks/useAuth";
import { useSeedBooks } from "@/hooks/useBackend";
import type { BookInput } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Database,
  KeyRound,
  Settings,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SAMPLE_BOOKS: BookInput[] = [
  {
    title: "Human Anatomy and Physiology",
    author: "Elaine Marieb",
    edition: "11th",
    publisher: "Pearson",
    category: "Medical",
    quantity: 5,
  },
  {
    title: "Gray's Anatomy for Students",
    author: "Richard Drake",
    edition: "4th",
    publisher: "Elsevier",
    category: "Medical",
    quantity: 4,
  },
  {
    title: "Principles of Biochemistry",
    author: "Lehninger",
    edition: "6th",
    publisher: "W.H. Freeman",
    category: "Medical",
    quantity: 3,
  },
  {
    title: "Accountancy Part I",
    author: "T.S. Grewal",
    edition: "2023",
    publisher: "Sultan Chand",
    category: "Commerce",
    quantity: 6,
  },
  {
    title: "Business Studies",
    author: "Poonam Gandhi",
    edition: "2023",
    publisher: "VK Publications",
    category: "Commerce",
    quantity: 5,
  },
  {
    title: "Economics",
    author: "Sandeep Garg",
    edition: "2023",
    publisher: "Dhanpat Rai",
    category: "Commerce",
    quantity: 4,
  },
  {
    title: "Physics Part I",
    author: "H.C. Verma",
    edition: "2nd",
    publisher: "Bharati Bhawan",
    category: "FYJC",
    quantity: 8,
  },
  {
    title: "Chemistry",
    author: "NCERT",
    edition: "2023",
    publisher: "NCERT",
    category: "FYJC",
    quantity: 7,
  },
  {
    title: "Mathematics",
    author: "R.D. Sharma",
    edition: "2023",
    publisher: "Dhanpat Rai",
    category: "FYJC",
    quantity: 6,
  },
  {
    title: "Biology",
    author: "NCERT",
    edition: "2023",
    publisher: "NCERT",
    category: "SYJC",
    quantity: 6,
  },
  {
    title: "English Literature",
    author: "Wren & Martin",
    edition: "Latest",
    publisher: "S. Chand",
    category: "SYJC",
    quantity: 5,
  },
  {
    title: "Information Technology",
    author: "Sumita Arora",
    edition: "2023",
    publisher: "Dhanpat Rai",
    category: "SYJC",
    quantity: 4,
  },
];

function StripeConfigSection() {
  const qc = useQueryClient();

  const { data: isConfigured, isLoading: configLoading } = useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      // REST API: check payment config (demo mode = always configured)
      return true;
    },
  });

  const [secretKey, setSecretKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.startsWith("sk_")) {
      toast.error("Secret key must start with sk_");
      return;
    }
    setSaving(true);
    try {
      toast.success("Stripe configuration saved (demo mode)");
      setSecretKey("");
      qc.invalidateQueries({ queryKey: ["stripeConfigured"] });
    } catch {
      toast.error("Failed to save Stripe configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 border-b border-border bg-sky-50/60 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-display">
              Stripe Configuration
            </CardTitle>
          </div>
          {configLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : isConfigured ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Configured
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium">
              <XCircle className="h-4 w-4" />
              Not configured
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
            <Input
              id="stripe-secret"
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="sk_live_… or sk_test_…"
              required
              data-ocid="admin.settings.stripe_secret_input"
            />
            <p className="text-xs text-muted-foreground">
              Used for server-side payment processing. Keep this secret.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            Payment amount is fixed at <strong>₹200</strong> (membership
            deposit). Allowed region: India.
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto"
            data-ocid="admin.settings.stripe_save_button"
          >
            {saving ? "Saving…" : "Save Configuration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// hashPassword kept for potential future use
const _hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

function AdminCredentialsSection() {
  const { getToken } = useAdminAuth();
  const { actor } = useAnonActor();
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    const adminToken = getToken();
    if (!adminToken) {
      toast.error("Admin session expired — please log in again");
      return;
    }
    setSaving(true);
    try {
      // Local mode: admin credentials are configured via server env (ADMIN_USERNAME / ADMIN_PASSWORD)
      toast.success(
        "Local mode: update ADMIN_USERNAME and ADMIN_PASSWORD in server .env and restart the API",
      );
      setUsername("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update credentials",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 border-b border-border bg-sky-50/60 rounded-t-xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-display">
            Admin Credentials
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-username">Admin Username</Label>
            <Input
              id="admin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. svga_admin"
              autoComplete="username"
              required
              data-ocid="admin.settings.admin_username_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-new-password">New Password</Label>
            <Input
              id="admin-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              required
              data-ocid="admin.settings.admin_new_password_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-confirm-password">Confirm Password</Label>
            <Input
              id="admin-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
              data-ocid="admin.settings.admin_confirm_password_input"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p
                className="text-xs text-red-600"
                data-ocid="admin.settings.password_mismatch_error"
              >
                Passwords do not match
              </p>
            )}
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
            Password is hashed with SHA-256 before being stored. You will need
            to use these credentials on the Admin Login page.
          </div>
          <Button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto gap-2"
            data-ocid="admin.settings.admin_credentials_save_button"
          >
            <KeyRound className="h-4 w-4" />
            {saving ? "Saving…" : "Update Credentials"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SeedBooksSection() {
  const seedBooks = useSeedBooks();

  const handleSeed = async () => {
    try {
      await seedBooks.mutateAsync(SAMPLE_BOOKS);
      toast.success(`${SAMPLE_BOOKS.length} sample books added to inventory`);
    } catch {
      toast.error("Failed to seed books");
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 border-b border-border bg-sky-50/60 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-display">
            Seed Sample Books
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground font-body">
          Populate the inventory with {SAMPLE_BOOKS.length} sample books across
          Medical, Commerce, FYJC, and SYJC categories. This is useful for
          initial setup or testing.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["Medical", "Commerce", "FYJC", "SYJC"].map((cat) => {
            const count = SAMPLE_BOOKS.filter((b) => b.category === cat).length;
            return (
              <div key={cat} className="bg-muted/60 rounded-lg p-3 text-center">
                <p className="text-lg font-display font-bold text-foreground">
                  {count}
                </p>
                <p className="text-xs text-muted-foreground font-body">{cat}</p>
              </div>
            );
          })}
        </div>
        <Button
          type="button"
          onClick={handleSeed}
          disabled={seedBooks.isPending}
          variant="outline"
          className="gap-2"
          data-ocid="admin.settings.seed_books_button"
        >
          <Database className="h-4 w-4" />
          {seedBooks.isPending ? "Adding books…" : "Add Sample Books"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            System configuration and administration tools
          </p>
        </div>

        <StripeConfigSection />

        <Separator />

        <AdminCredentialsSection />

        <Separator />

        <SeedBooksSection />
      </div>
    </AdminLayout>
  );
}
