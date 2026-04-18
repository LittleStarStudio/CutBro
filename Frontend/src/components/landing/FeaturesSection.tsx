import {
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Clock,
  Bell,
  Smartphone,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Easy Booking",
    description:
      "Customers can book anytime, barbers receive schedules automatically, and owners monitor all activities.",
  },
  {
    icon: Users,
    title: "For Every Role",
    description:
      "A complete platform for customers, professional barbers, and barbershop owners.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payments",
    description:
      "Multiple secure and convenient digital payment options for all users.",
  },
  {
    icon: BarChart3,
    title: "Complete Dashboard",
    description:
      "Each role gets a dedicated dashboard tailored to their specific needs.",
  },
  {
    icon: Clock,
    title: "Save Time",
    description:
      "No more waiting in line or calling. Everything can be done right from your device.",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description:
      "Instant booking updates and automatic reminders for all users.",
  },
  {
    icon: Smartphone,
    title: "Access Anywhere",
    description:
      "Use the platform from any device, anytime you need it.",
  },
  {
    icon: Shield,
    title: "Secure & Trusted",
    description:
      "User data security is our top priority.",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-16 sm:py-24 lg:py-32 bg-neutral-950 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* ✅ Tambah px-4 sm:px-6 agar tidak mepet di mobile */}
      <div className="container-custom relative z-10 px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 mb-6">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
              Why CutBro?
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="text-white">Features for </span>
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
              Every Need
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-neutral-400 leading-relaxed px-2 sm:px-0">
            A complete solution for customers, barbers, and barbershop owners —
            all in one platform.
          </p>
        </div>

        {/* Features Grid */}
        {/* ✅ 1 kolom di mobile, 2 di tablet, 4 di desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="group relative bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-6 sm:p-8 transition-all duration-500 hover:bg-neutral-900/80 hover:border-amber-500/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:via-transparent group-hover:to-emerald-500/5 transition-all duration-500 pointer-events-none" />

                <div className="relative mb-5 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 group-hover:text-amber-300 transition-colors" />
                  </div>

                  <div className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 bg-amber-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="relative">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-amber-50 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-neutral-400 text-sm leading-relaxed group-hover:text-neutral-300 transition-colors">
                    {feature.description}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/50 transition-all duration-500 rounded-b-2xl" />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div
          className="text-center mt-12 sm:mt-16 animate-fade-in"
          style={{ animationDelay: "0.8s" }}
        >
          <p className="text-neutral-500 text-sm">
            And many more features continuously being developed
          </p>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;