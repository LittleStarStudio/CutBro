import { Star, Quote } from "lucide-react";
import customer1 from "@/assets/customer-1.jpg";
import owner1 from "@/assets/owner-1.jpg";
import barber1 from "@/assets/barber-1.jpg";

const testimonials = [
  {
    name: "Michael Chen",
    role: "Barbershop Owner",
    type: "owner",
    image: owner1,
    content:
      "BarberBook transformed my business completely. Bookings increased by 60% and customer satisfaction is at an all-time high!",
    rating: 5,
    location: "New York, USA",
  },
  {
    name: "David Martinez",
    role: "Regular Customer",
    type: "customer",
    image: customer1,
    content:
      "No more waiting in line! I can book my favorite barber anytime, anywhere. The reminder notifications are super helpful.",
    rating: 5,
    location: "Los Angeles, USA",
  },
  {
    name: "James Wilson",
    role: "Professional Barber",
    type: "barber",
    image: barber1,
    content:
      "Managing my schedule has never been easier. I can focus on what I do best - giving great haircuts!",
    rating: 5,
    location: "Chicago, USA",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 lg:py-32 bg-zinc-950 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-zinc-950"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-emerald-400 font-semibold text-sm uppercase tracking-[0.2em] mb-4 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-transparent bg-clip-text">
              10,000+ Users
            </span>
          </h2>
          <p className="text-lg text-zinc-400 leading-relaxed">
            Hear success stories from owners, barbers, and customers who love BarberBook.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className={`
                relative bg-zinc-900 rounded-2xl p-8 border border-zinc-800
                transition-all duration-500 ease-out
                hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10
                hover:-translate-y-2 group
                ${index === 1 ? 'md:scale-105 md:z-10 border-emerald-500/30' : ''}
              `}
            >
              {/* Badge for Customer (middle card) */}
              {testimonial.type === 'customer' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/30 border border-emerald-400/30">
                    <Star className="w-3 h-3 fill-white" />
                    Featured Customer
                  </span>
                </div>
              )}

              {/* Quote Icon */}
              <Quote className="w-12 h-12 text-emerald-500/20 mb-6 group-hover:text-emerald-500/30 transition-colors" />

              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-amber-400 text-amber-400 transition-transform group-hover:scale-110"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-zinc-300 mb-8 leading-relaxed text-base">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-zinc-800 group-hover:border-zinc-700 transition-colors">
                <div className="relative">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-zinc-800 group-hover:ring-emerald-500/50 transition-all duration-300"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                  <p className="font-bold text-white text-base mb-1">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-zinc-400 mb-1">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-emerald-400 font-medium">
                    📍 {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-zinc-800/50">
          <div className="text-center group">
            <div className="inline-block mb-4">
              <p className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-transparent bg-clip-text mb-2 transition-transform group-hover:scale-110 duration-300">
                500+
              </p>
            </div>
            <p className="text-zinc-400 text-base uppercase tracking-wider">Barbershops</p>
          </div>
          <div className="text-center group">
            <div className="inline-block mb-4">
              <p className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 text-transparent bg-clip-text mb-2 transition-transform group-hover:scale-110 duration-300">
                10K+
              </p>
            </div>
            <p className="text-zinc-400 text-base uppercase tracking-wider">Happy Customers</p>
          </div>
          <div className="text-center group">
            <div className="inline-block mb-4">
              <p className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-transparent bg-clip-text mb-2 transition-transform group-hover:scale-110 duration-300">
                98%
              </p>
            </div>
            <p className="text-zinc-400 text-base uppercase tracking-wider">Satisfaction Rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}