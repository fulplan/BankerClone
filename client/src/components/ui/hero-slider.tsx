import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=800",
    title: "Ghana Deposit Protection",
    subtitle: "Your deposits are protected with comprehensive insurance coverage, giving you peace of mind with every transaction.",
    buttonText: "KNOW MORE"
  },
  {
    image: "https://images.unsplash.com/photo-1559526324-593bc054d924?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=800",
    title: "Digital Banking Excellence",
    subtitle: "Experience the future of banking with our innovative digital solutions and 24/7 online services.",
    buttonText: "GET STARTED"
  },
  {
    image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=800",
    title: "Investment Opportunities",
    subtitle: "Grow your wealth with our comprehensive investment services and expert financial guidance.",
    buttonText: "INVEST NOW"
  },
  {
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=800",
    title: "Business Banking Solutions",
    subtitle: "Power your business forward with tailored commercial banking solutions and expert support.",
    buttonText: "LEARN MORE"
  },
  {
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=800",
    title: "Personal Financial Planning",
    subtitle: "Secure your financial future with our personalized banking services and wealth management solutions.",
    buttonText: "PLAN TODAY"
  },
  {
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=800",
    title: "Mobile Banking App",
    subtitle: "Bank anywhere, anytime with our award-winning mobile app featuring advanced security and convenience.",
    buttonText: "DOWNLOAD NOW"
  },
  {
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=800",
    title: "Exceptional Customer Service",
    subtitle: "Experience personalized banking with our dedicated customer support team available 24/7.",
    buttonText: "CONTACT US"
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative h-96 overflow-hidden">
      {/* Background Images */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: `url('${slide.image}')`
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 transition-all duration-500">
            {heroSlides[currentSlide].title}
          </h1>
          <p className="text-lg text-white mb-8 opacity-90 transition-all duration-500">
            {heroSlides[currentSlide].subtitle}
          </p>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-sm font-semibold rounded-md transition-all duration-200 transform hover:scale-105"
            data-testid="button-hero-cta"
          >
            {heroSlides[currentSlide].buttonText}
          </Button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all duration-200"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Carousel Dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}