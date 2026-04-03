import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Users,
  Scissors,
  Store,
  Check,
  Star,
  Zap,
} from "lucide-react";

const roles = [
  {
    icon: Users,
    label: "Customer",
    color: "from-amber-400 to-amber-600",
    description: "Easy & fast booking",
  },
  {
    icon: Scissors,
    label: "Barber",
    color: "from-yellow-400 to-amber-500",
    description: "Manage schedule efficiently",
  },
  {
    icon: Store,
    label: "Owner",
    color: "from-amber-500 to-orange-600",
    description: "Monitor business in real-time",
  },
];

const benefits = [
  "Free registration",
  "Setup in 5 minutes",
  "No credit card required",
  "24/7 support",
];

export function CTASection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-8 sm:py-24 lg:py-32 bg-neutral-950">
      {/* ================= BACKGROUND DECOR ================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl bg-amber-500/20 animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl bg-yellow-500/15 animate-float-delayed" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0a0a0a_100%)]" />
      </div>

      {/* ✅ Padding horizontal di mobile */}
      <div className="container-custom relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* ================= BADGE ================= */}
          <div className="flex justify-center mb-6 sm:mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-sm font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Free for All Users
              </span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
          </div>

          {/* ================= HEADING ================= */}
          <div className="text-center mb-10 sm:mb-12 animate-slide-up">
            <h2 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight">
              <span className="text-white">Ready to Join </span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  CutBro
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 rounded-full" />
              </span>
              <span className="text-white">?</span>
            </h2>

            <p className="mx-auto mb-0 max-w-2xl text-base sm:text-lg md:text-xl text-neutral-400 leading-relaxed px-2 sm:px-0">
              Join{" "}
              <span className="font-bold text-white">10,000+ users</span>{" "}
              who already enjoy the convenience of CutBro.
            </p>
          </div>

          {/* ================= ROLE CARDS ================= */}
          {/* ✅ 3 kolom di semua ukuran tapi padding & ukuran menyesuaikan */}
          <div
            className="mx-auto mb-10 sm:mb-12 grid max-w-4xl grid-cols-3 gap-3 sm:gap-6 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            {roles.map((role, index) => (
              <div
                key={role.label}
                className="group relative cursor-pointer rounded-xl sm:rounded-2xl border border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm p-4 sm:p-8 transition-all duration-500 hover:-translate-y-2 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/20"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <div
                  className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br ${role.color} opacity-0 transition-opacity duration-500 group-hover:opacity-10`}
                />

                <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4 text-center">
                  <div className="relative">
                    <div
                      className={`h-12 w-12 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br ${role.color} p-0.5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                    >
                      <div className="flex h-full w-full items-center justify-center rounded-xl bg-neutral-950">
                        <role.icon className="h-6 w-6 sm:h-8 sm:w-8 text-amber-400 group-hover:text-amber-300" />
                      </div>
                    </div>
                    <div className="absolute inset-0 h-12 w-12 sm:h-16 sm:w-16 bg-amber-500/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-white mb-0.5 sm:mb-1 group-hover:text-amber-50">
                      {role.label}
                    </h3>
                    {/* Sembunyikan description di mobile agar tidak terlalu penuh */}
                    <p className="hidden sm:block text-sm text-neutral-500 group-hover:text-neutral-400">
                      {role.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${role.color} opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-b-2xl`}
                />
              </div>
            ))}
          </div>

          {/* ================= CTA BUTTONS ================= */}
          <div
            className="mb-10 sm:mb-12 flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="hero" className="group relative overflow-hidden w-full">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Sign Up Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </Link>

            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="hero-outline" className="w-full">
                Login to Account
              </Button>
            </Link>
          </div>

          {/* ================= BENEFITS ================= */}
          {/* ✅ 2 kolom di mobile, wrap di desktop */}
          <div
            className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-8 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 group">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span className="text-xs sm:text-sm text-neutral-400 font-medium">
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* ================= TRUST INDICATOR ================= */}
          <div className="mt-8 sm:mt-12 pb-4 sm:pb-0 text-center animate-fade-in">
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-neutral-500 text-xs sm:text-sm">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-neutral-950 flex items-center justify-center"
                  >
                    <span className="text-xs text-white font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                  </div>
                ))}
              </div>
              <span className="text-center sm:text-left">
                Trusted by thousands of barbershop professionals
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default CTASection;