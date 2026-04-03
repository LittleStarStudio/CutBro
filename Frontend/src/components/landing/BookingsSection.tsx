import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
  MapPin,
  ArrowRight,
  Calendar,
  User,
  Scissors,
  Lock,
  Sparkles,
} from "lucide-react";
import barbershop1 from "@/assets/barbershop-1.jpg";
import barbershop2 from "@/assets/barbershop-2.jpg";
import barbershop3 from "@/assets/barbershop-3.jpg";

const featuredBarbershops = [
  {
    id: 1,
    name: "Gentleman's Barbershop",
    image: barbershop1,
    rating: 4.9,
    reviews: 234,
    location: "South Jakarta",
    distance: "1.2 km",
    price: "Starting from $35",
    services: ["Haircut", "Beard Trim", "Hair Coloring"],
  },
  {
    id: 2,
    name: "Classic Cuts Studio",
    image: barbershop2,
    rating: 4.8,
    reviews: 189,
    location: "Central Jakarta",
    distance: "2.5 km",
    price: "Starting from $30",
    services: ["Haircut", "Hot Shave", "Hair Treatment"],
  },
  {
    id: 3,
    name: "Modern Barber House",
    image: barbershop3,
    rating: 4.7,
    reviews: 156,
    location: "West Jakarta",
    distance: "3.1 km",
    price: "Starting from $40",
    services: ["Premium Cut", "Styling", "Beard Care"],
  },
];

const bookingSteps = [
  {
    icon: Scissors,
    number: "01",
    title: "Choose Service",
    description: "Select your desired service from our premium selection of grooming options",
  },
  {
    icon: User,
    number: "02",
    title: "Select Barber",
    description: "Choose a professional barber based on expertise and specialization",
  },
  {
    icon: Calendar,
    number: "03",
    title: "Set Schedule",
    description: "Pick a convenient date and time that fits your busy schedule",
  },
];

export function BookingsSection() {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleBookingClick = () => {
    setShowLoginPrompt(true);
  };

  return (
    <section className="py-24 lg:py-32 bg-zinc-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px)`,
        }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500 tracking-wide">
              MODERN BOOKING SYSTEM
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Book in
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300"> 3 Simple Steps</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Reserve your premium barbershop with our fast, easy, and trusted booking system
          </p>
        </div>

        {/* Booking Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {bookingSteps.map((step, index) => (
            <div
              key={index}
              className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-2"
            >
              {/* Number Badge */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors duration-300">
                <step.icon className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-500 transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                {step.description}
              </p>

              {/* Hover Effect Line */}
              <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"></div>
            </div>
          ))}
        </div>

        {/* Featured Barbershops */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Featured Barbershops
              </h3>
              <p className="text-zinc-400">
                Handpicked for your best grooming experience
              </p>
            </div>
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-2 text-amber-500 hover:text-amber-400 font-semibold group transition-colors"
            >
              View All
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBarbershops.map((shop) => (
              <div
                key={shop.id}
                className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-amber-500/10"
                onClick={handleBookingClick}
              >
                {/* Image */}
                <div className="relative overflow-hidden h-56">
                  <img
                    src={shop.image}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent opacity-60"></div>
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-zinc-950/90 backdrop-blur-sm border border-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-bold text-white">
                      {shop.rating}
                    </span>
                    <span className="text-xs text-zinc-400">
                      ({shop.reviews})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h4 className="text-xl font-bold text-white mb-3 group-hover:text-amber-500 transition-colors">
                    {shop.name}
                  </h4>

                  <div className="flex items-center gap-3 text-sm text-zinc-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" strokeWidth={2} />
                      {shop.location}
                    </span>
                    <span className="text-amber-500">•</span>
                    <span className="font-medium">{shop.distance}</span>
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {shop.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 hover:border-amber-500/50 transition-colors"
                      >
                        {service}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <span className="text-sm font-bold text-amber-500">
                      {shop.price}
                    </span>
                    <button className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 group-hover:scale-105">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile "View All" Link */}
          <Link
            to="/login"
            className="sm:hidden flex items-center justify-center gap-2 text-amber-500 hover:text-amber-400 font-semibold mt-8 group transition-colors"
          >
            View All Barbershops
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* CTA Section */}
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 rounded-3xl p-12 lg:p-16 text-center overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to Look
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300"> Sharp & Fresh?</span>
            </h3>
            <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
              Join now and experience a faster, easier, and more modern way to book your barbershop
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-base rounded-xl hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2">
                  Sign Up Free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-zinc-800 border-2 border-zinc-700 text-white font-bold text-base rounded-xl hover:border-amber-500/50 hover:bg-zinc-800/80 transition-all duration-300">
                  Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-10 text-center transform transition-all duration-300 scale-100 hover:scale-[1.02]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
              <Lock className="w-10 h-10 text-amber-500" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-xl"></div>
            </div>

            {/* Content */}
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Login Required
            </h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Please login or sign up first to book your favorite barbershop
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link to="/login" className="flex-1">
                <button className="w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105">
                  Login
                </button>
              </Link>
              <Link to="/register" className="flex-1">
                <button className="w-full px-6 py-3.5 bg-zinc-800 border-2 border-zinc-700 text-white font-bold rounded-xl hover:border-amber-500/50 transition-all duration-300">
                  Sign Up
                </button>
              </Link>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="text-sm text-zinc-500 hover:text-white transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}