import Navbar from "@/components/ui/navbar";
import HeroSection from "@/components/ui/hero-section";
import ServicesSection from "@/components/ui/services-section";
import CurrencyTicker from "@/components/ui/currency-ticker";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <CurrencyTicker />
      </div>
      <HeroSection />
      <ServicesSection />
      
      {/* Investment Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Business professionals in investment meeting" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Invest with confidence</h2>
              <p className="text-lg text-gray-600 mb-8">
                Finora Investment Services offers a wide range of solutions that provide the guidance you need to set investment goals and the tools you need to achieve them. Start working with a Financial Advisor today.
              </p>
              <button className="bg-finora-primary text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-finora-dark transition-colors duration-200">
                Start investing →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Appointment Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Let's meet <strong>in person</strong></h2>
                <div className="flex items-center mb-6">
                  <i className="fas fa-calendar-alt text-finora-primary text-2xl mr-4"></i>
                  <p className="text-lg text-gray-600">Schedule one-on-one time with a banker.</p>
                </div>
                <button className="bg-finora-primary text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-finora-dark transition-colors duration-200">
                  Book now
                </button>
              </div>
              <div>
                <img 
                  src="https://images.unsplash.com/photo-1664575602554-2087b04935a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Customer meeting with bank advisor" 
                  className="rounded-lg shadow-lg w-full h-auto" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Banking Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Finora mobile banking for anywhere convenience</h2>
            <p className="text-lg text-gray-600">
              Make Mobile Check Deposits, set up Alerts, manage cards, and more, all from the Finora Mobile Banking App. It's the simplest, most secure way to manage your money on the go.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Download our highly-rated app</h3>
              <p className="text-gray-600 mb-6">4.7 out of 5 Rating. Based on 379k ratings on the App Store as of 3/26/2025</p>
              
              <div className="flex space-x-4 mb-8">
                <img src="https://www.santanderbank.com/documents/330001/14323886/27601_apple_btn+%281%29.jpg/bf7ba4f1-97b8-1d4e-28bc-ae5aa6ecbcb8" alt="Download on App Store" className="h-12" />
                <img src="https://www.santanderbank.com/documents/330001/14323886/27601_google_btn+%281%29.jpg/dd96fe00-ed38-b079-1e46-319aa5d3776c" alt="Get it on Google Play" className="h-12" />
              </div>
              
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">Get started with one of our mobile app tutorials:</p>
                <a href="#" className="block text-finora-primary hover:underline">Mobile Check Deposit</a>
                <a href="#" className="block text-finora-primary hover:underline">Set up Alerts</a>
                <a href="#" className="block text-finora-primary hover:underline">Manage cards</a>
              </div>
            </div>
            <div className="text-center">
              <img 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600" 
                alt="Person using mobile banking app" 
                className="rounded-lg shadow-lg mx-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Finora Bank</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Personal Banking</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Investing</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Small Business</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Commercial</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Private Client</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">About</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Our Commitment</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Leadership</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Media Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Shareholder Relations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Support Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">SCRA Benefits</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Homeowner Assistance</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Resources & Help</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Find a Branch/ATM</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Personal Banking Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Security Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Site Map</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-400 mb-4 md:mb-0">
                <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a> |{" "}
                <a href="#" className="hover:text-white transition-colors duration-200">Terms of Use</a> |{" "}
                <a href="#" className="hover:text-white transition-colors duration-200">Accessibility</a>
              </div>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-4 text-center md:text-left">
              © 2025 Finora Bank, N.A. Equal Housing Lender - Member FDIC
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
