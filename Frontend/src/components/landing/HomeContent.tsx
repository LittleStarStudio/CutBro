import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { CTASection } from "@/components/landing/CTASection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";

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

      <section id="testimoni" className="scroll-mt-6">
        <TestimonialsSection />
      </section>

      <section>
        <CTASection />
      </section>
    </>
  );
}
