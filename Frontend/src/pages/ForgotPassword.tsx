import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Scissors } from "lucide-react";
import Button from "@/components/ui/Button";
import { forgotPassword } from "@/services/auth.service";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [isSent,  setIsSent]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message
        ?? "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-amber-500 flex items-center justify-center">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <p className="text-neutral-400 text-sm">
            Enter your email to receive a reset link
          </p>
        </div>

        {isSent ? (
          <p className="text-green-400 text-sm text-center">
            A password reset link has been sent to your email ✉️
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-800 text-white border border-neutral-700"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="block text-center text-sm text-amber-400 hover:underline"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
