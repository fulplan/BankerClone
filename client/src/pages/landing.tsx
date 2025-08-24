import Navbar from "@/components/ui/navbar";
import HeroSlider from "@/components/ui/hero-slider";
import ServicesSection from "@/components/ui/services-section";
import { Button } from "@/components/ui/button";
import { Building, CreditCard, Smartphone, PiggyBank, FileText, TrendingUp, Users, ShoppingCart, Calendar, ArrowRight, Download, Award, DollarSign, Gift } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />

      {/* Dynamic Hero Section with Image Slider */}
      <HeroSlider />
      
      {/* Re-add Services Section */}
      <ServicesSection />

      {/* Service Icons Section */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-finora-primary group-hover:bg-opacity-10 transition-colors duration-200">
                <Building className="w-8 h-8 text-finora-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-finora-primary transition-colors duration-200">Accounts & Deposits</span>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-finora-primary group-hover:bg-opacity-10 transition-colors duration-200">
                <FileText className="w-8 h-8 text-finora-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-finora-primary transition-colors duration-200">Personal Loans</span>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-finora-primary group-hover:bg-opacity-10 transition-colors duration-200">
                <TrendingUp className="w-8 h-8 text-finora-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-finora-primary transition-colors duration-200">Wealth</span>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-finora-primary group-hover:bg-opacity-10 transition-colors duration-200">
                <Award className="w-8 h-8 text-finora-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-finora-primary transition-colors duration-200">Rewards</span>
            </div>
            <div className="flex flex-col items-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-finora-primary group-hover:bg-opacity-10 transition-colors duration-200">
                <CreditCard className="w-8 h-8 text-finora-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-finora-primary transition-colors duration-200">Debit Cards</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Banking Section - Re-added from old design */}
      <section className="bg-finora-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-12">
            <h2 className="text-3xl font-bold mb-4">Finora Mobile Banking</h2>
            <p className="text-lg opacity-90">Bank anywhere, anytime with our award-winning mobile app</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-6">Download our highly-rated app</h3>
              <p className="mb-6 opacity-90">4.7 out of 5 Rating. Based on 379k ratings on the App Store</p>
              
              <div className="flex space-x-4 mb-8">
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium">App Store</span>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium">Google Play</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="font-semibold">Get started with mobile banking:</p>
                <a href="#" className="block text-green-200 hover:text-white transition-colors">• Mobile Check Deposit</a>
                <a href="#" className="block text-green-200 hover:text-white transition-colors">• Set up Alerts</a>
                <a href="#" className="block text-green-200 hover:text-white transition-colors">• Manage Cards</a>
                <a href="#" className="block text-green-200 hover:text-white transition-colors">• Transfer Money</a>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-10 rounded-lg p-8">
                <Smartphone className="w-24 h-24 text-white mx-auto mb-4" />
                <p className="text-white opacity-90">Mobile Banking App Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
            <a href="#" className="text-finora-primary hover:underline text-sm font-medium">View More</a>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1559526324-593bc054d924?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Digital banking promotion" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Experience simplified account opening with FinoraOneBank</h3>
                <p className="text-gray-600 text-sm mb-4">Open your banking experience at a branch with the OneBank mobile banking app.</p>
                <p className="text-xs text-gray-500">Offer valid through Dec 31, 2025</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Credit card promotion" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Get Great Local Privileges</h3>
                <p className="text-gray-600 text-sm mb-4">Get exclusive discounts and offers with your Finora card at participating merchants.</p>
                <p className="text-xs text-gray-500">Terms and conditions apply</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Business banking promotion" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Business Growth Solutions</h3>
                <p className="text-gray-600 text-sm mb-4">Unlock your business potential with our comprehensive banking solutions.</p>
                <p className="text-xs text-gray-500">Contact us for more details</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banking for Individuals Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-12">Banking for Individuals</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Personal Banking" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Personal Banking</h3>
                <p className="text-gray-600 text-sm mb-4">Comprehensive personal banking solutions for all your financial needs.</p>
                <a href="#" className="text-finora-primary text-sm font-medium hover:underline">Learn more</a>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Digital Banking" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Digital Banking</h3>
                <p className="text-gray-600 text-sm mb-4">Banking at your fingertips with our advanced digital platform.</p>
                <a href="#" className="text-finora-primary text-sm font-medium hover:underline">Get started</a>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Islamic Banking" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Islamic Banking</h3>
                <p className="text-gray-600 text-sm mb-4">Sharia-compliant banking solutions designed for your values.</p>
                <a href="#" className="text-finora-primary text-sm font-medium hover:underline">Explore</a>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Priority Banking" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Priority Banking</h3>
                <p className="text-gray-600 text-sm mb-4">Exclusive banking services for our valued priority customers.</p>
                <a href="#" className="text-finora-primary text-sm font-medium hover:underline">Learn more</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banking for Companies Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-12">Banking for Companies</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Business Banking" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Business Banking</h3>
                <p className="text-gray-600 text-sm mb-4">Streamlined banking solutions designed for small and medium enterprises.</p>
                <a href="#" className="text-finora-primary text-sm font-medium hover:underline">Learn more</a>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Corporate Banking" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Corporate Banking</h3>
                <p className="text-gray-600 text-sm mb-4">Comprehensive corporate solutions for large enterprises and institutions.</p>
                <a href="#" className="text-finora-primary text-sm font-medium hover:underline">Discover</a>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                alt="Trade Finance" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Trade Finance</h3>
                <p className="text-gray-600 text-sm mb-4">International trade finance solutions to support your global business.</p>
                <a href="#" className="text-finora-primary text-sm font-medium hover:underline">Get started</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's New Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-12">What's New</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                alt="Bank branch expansion" 
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">Stay in touch everywhere you are with our mobile app.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                alt="Digital innovation" 
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">Learn more about our world-class internet banking platform and online tools.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                alt="Investment opportunities" 
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">Explore the trading, budgeting and analytics tools available on our platform.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                alt="Customer support" 
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">Learn all about how to quickly and easily open your first account.</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                alt="Financial planning" 
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">Get hands-on experience with our technology and innovation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section 1 */}
      <section className="relative py-24 bg-gradient-to-r from-finora-primary to-finora-dark">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1559526324-593bc054d924?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600')"
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            LET US UNDERSTAND EXACTLY
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
            What your business requires
          </h3>
          <Button 
            className="bg-white text-finora-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-md"
            data-testid="button-learn-more"
          >
            LEARN MORE
          </Button>
        </div>
      </section>

      {/* CTA Section 2 */}
      <section className="relative py-24 bg-gradient-to-r from-green-600 to-green-800">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600')"
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            INVEST WITH OUR TEAM AS WE
          </h2>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
            Get amazing results you expected
          </h3>
          <Button 
            className="bg-white text-green-700 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-md"
            data-testid="button-get-started"
          >
            GET STARTED
          </Button>
        </div>
      </section>

      {/* Important Information Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Important Information</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-finora-primary mr-3" />
                <span className="font-medium text-gray-900">November 1, 2024</span>
              </div>
              <span className="text-gray-600">Notice of Proposed Account Changes</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-finora-primary mr-3" />
                <span className="font-medium text-gray-900">May 15, 2024</span>
              </div>
              <span className="text-gray-600">Online Payment Account Update</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-finora-primary mr-3" />
                <span className="font-medium text-gray-900">July 30, 2024</span>
              </div>
              <span className="text-gray-600">Get The 2024 Financial Statement</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-finora-primary mr-3" />
                <span className="font-medium text-gray-900">July 2, 2024</span>
              </div>
              <span className="text-gray-600">Online More Than Anticipated Currently</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">ABOUT US</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">PROFILE</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">HISTORY</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">LEADERSHIP</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">COMMUNITY</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">SHAREHOLDER RELATIONS</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">SUSTAINABILITY</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">CAREERS</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">EXPLORE OPPORTUNITIES</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">STUDENT PROGRAMS</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">BENEFITS</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">DIVERSITY & INCLUSION</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">MILITARY HIRING</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">CAMPUS RECRUITING</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">CUSTOMER SERVICE</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">CONTACT US</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">BRANCH LOCATOR</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">ATM LOCATOR</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">ORDER CHECKS</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">ROUTING NUMBER</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">CUSTOMER FEEDBACK</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">LEGAL</h3>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors duration-200">PRIVACY POLICY</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">TERMS OF USE</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">ACCESSIBILITY</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">SECURITY CENTER</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">SITE MAP</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">FRAUD PREVENTION</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">MOBILE APPS</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <img 
                    src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" 
                    alt="Download on App Store" 
                    className="h-10"
                  />
                </div>
                <div>
                  <img 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" 
                    alt="Get it on Google Play" 
                    className="h-10"
                  />
                </div>
              </div>
              <div className="mt-8">
                <h4 className="font-semibold text-sm mb-4">FOLLOW US</h4>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    <i className="fab fa-facebook text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    <i className="fab fa-twitter text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    <i className="fab fa-linkedin text-xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                    <i className="fab fa-instagram text-xl"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="text-xs text-gray-400 text-center">
              © 2025 Finora Bank, N.A. All rights reserved. Member FDIC. Equal Housing Lender.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}