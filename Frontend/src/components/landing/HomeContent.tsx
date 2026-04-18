import { HeroSection }               from "@/components/landing/HeroSection";
import { FeaturesSection }            from "@/components/landing/FeaturesSection";
import HowItWorksSection              from "@/components/landing/HowItWorksSection";
import { TestimonialsSection }        from "@/components/landing/TestimonialsSection";
import FeaturedBarbershopsSection     from "@/components/landing/FeaturedBarbershopsSection";

export default function HomeContent() {
  return (
    <>
      <section id="hero" className="scroll-mt-6">
        <HeroSection />
      </section>

      <section id="features" className="scroll-mt-6">
        <FeaturesSection />
      </section>

      <section id="how-it-works" className="scroll-mt-6">
        <HowItWorksSection />
      </section>

      {/* Featured Barbershops — menggantikan CTASection, posisi sebelum Testimonials */}
      <section id="featured" className="scroll-mt-6">
        <FeaturedBarbershopsSection />
      </section>

      {/* Testimonials — sekarang di bawah Featured */}
      <section id="testimoni" className="scroll-mt-6">
        <TestimonialsSection />
      </section>
    </>
  );
}
