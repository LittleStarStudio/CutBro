import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import {
  Building2,
  Settings,
  CalendarCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Building2,
    title: "Create a Free Account",
    description:
      "Sign up as a customer, barber, or barbershop owner. Quick and easy registration.",
    color: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/20",
  },
  {
    number: "02",
    icon: Settings,
    title: "Complete Your Profile",
    description:
      "Fill in your details based on your role. Each role unlocks different features.",
    color: "from-amber-700 to-yellow-500",
    bgGlow: "bg-amber-700/40",
  },
  {
    number: "03",
    icon: CalendarCheck,
    title: "Start Using the Platform",
    description:
      "Book appointments, manage schedules, or monitor your business — all in one place.",
    color: "from-yellow-500 to-amber-600",
    bgGlow: "bg-yellow-500/20",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-16 sm:py-24 lg:py-32 bg-neutral-900 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* ✅ Padding horizontal di mobile */}
      <div className="container-custom relative z-10 px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 lg:mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
              How It Works
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            <span className="text-white">Get Started in </span>
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
              3 Easy Steps
            </span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-neutral-400 leading-relaxed px-2 sm:px-0">
            Choose your role and start enjoying the convenience of BarberBook.
          </p>
        </div>

        {/* Steps Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connection Line (Desktop only) */}
          <div className="hidden lg:block absolute top-32 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative group animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Card */}
                <div className="relative bg-neutral-950/80 backdrop-blur-sm border border-neutral-800/50 rounded-2xl p-6 sm:p-8 lg:p-10 transition-all duration-500 hover:bg-neutral-950 hover:border-amber-500/30 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/20">
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/10 group-hover:via-transparent group-hover:to-transparent transition-all duration-500 pointer-events-none" />

                  {/* Step Number */}
                  <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4">
                    <div
                      className={`w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}
                    >
                      <span className="text-sm sm:text-2xl font-bold text-white">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="relative mb-6 sm:mb-8">
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${step.color} bg-opacity-10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-all duration-500`}
                    >
                      <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 group-hover:text-amber-300 transition-colors" />
                    </div>

                    <div
                      className={`absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 ${step.bgGlow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 group-hover:text-amber-50 transition-colors">
                      {step.title}
                    </h3>

                    <p className="text-sm sm:text-base text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom Accent */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-b-2xl`}
                  />
                </div>

                {/* Arrow — mobile: bawah card, desktop: kanan card */}
                {index < steps.length - 1 && (
                  <>
                    {/* Desktop arrow */}
                    <div className="hidden lg:block absolute top-32 -right-6 z-20">
                      <div className="w-12 h-12 rounded-full bg-neutral-900 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/10 transition-all duration-500">
                        <ArrowRight className="w-6 h-6 text-amber-400" />
                      </div>
                    </div>

                    {/* Mobile arrow — rotated ke bawah */}
                    <div className="lg:hidden flex justify-center mt-4 mb-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-900 border border-amber-500/30 flex items-center justify-center rotate-90">
                        <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 sm:mt-16 lg:mt-20 animate-fade-in">
          <p className="text-neutral-500 text-sm mb-5 sm:mb-6">
            Ready to start your journey?
          </p>

          <Link to="/register">
            <Button variant="hero" className="group">
              Get Started Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;