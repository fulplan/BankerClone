import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              The best financial tools and advice for every need.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Simple and secure personal banking available in person, online, or on your device.
            </p>
            <Button 
              className="bg-santander-red text-white px-8 py-3 text-lg font-semibold hover:bg-santander-dark"
              data-testid="button-choose-checking"
            >
              Choose your checking account
            </Button>
          </div>
          <div>
            <img 
              src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Woman using mobile banking services" 
              className="rounded-lg shadow-lg w-full h-auto" 
              data-testid="img-hero"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
