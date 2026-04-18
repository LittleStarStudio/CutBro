import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Star, Users, Calendar, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-barbershop.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt="Premium Barbershop"
          className="w-full h-full object-cover"
        />

        {/* Stronger overlay for better content visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/98 to-background/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-neutral-950/60" />
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-noise" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/8 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Content */}
      <div className="container-custom relative z-10 px-6 sm:px-8 lg:px-12 xl:px-16 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-5 py-2.5 mb-8 animate-fade-in backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-100 font-semibold">
              Welcome to CutBro
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            <span className="text-white drop-shadow-lg">
              One Platform for{" "}
            </span>
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl">
              All Your Needs
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl text-amber-50/90 mb-10 max-w-2xl leading-relaxed animate-slide-up drop-shadow-md"
            style={{ animationDelay: "0.1s" }}
          >
            Whether you're a customer looking for the best barbershop, a
            professional barber, or an owner growing your business — CutBro
            is here for you.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="hero" className="group w-full">
                Get Started
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="hero-outline" className="group w-full">
                <Play className="w-5 h-5" />
                Already Have an Account
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="text-sm text-amber-100/70">Active Users</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-sm text-amber-100/70">Partner Barbershops</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">4.9</p>
                <p className="text-sm text-amber-100/70">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.015] pointer-events-none" />
    </section>
  );
}

export default HeroSection;
