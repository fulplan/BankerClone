import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Business() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar showLogin={true} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-finora-secondary to-finora-primary py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Power Your Business Forward</h1>
            <p className="text-xl mb-8">Comprehensive banking solutions designed to help your business grow and thrive</p>
            <Button className="bg-white text-finora-primary hover:bg-gray-100 px-8 py-3 text-lg">
              Start Banking With Us
            </Button>
          </div>
        </div>
      </section>

      {/* Business Banking Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">Business Banking Solutions</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-briefcase text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Business Checking</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Streamlined business checking accounts with tools to manage your cash flow effectively.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ No minimum balance options</li>
                  <li>✓ Free business debit card</li>
                  <li>✓ Online banking & mobile app</li>
                  <li>✓ Unlimited electronic transactions</li>
                </ul>
                <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                  Open Account
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-chart-line text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Business Loans</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Flexible financing options to support your business expansion and working capital needs.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ SBA loans available</li>
                  <li>✓ Equipment financing</li>
                  <li>✓ Lines of credit</li>
                  <li>✓ Commercial real estate loans</li>
                </ul>
                <Button variant="outline" className="border-finora-secondary text-finora-secondary hover:bg-finora-secondary hover:text-white">
                  Apply Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-credit-card text-white text-2xl"></i>
                </div>
                <CardTitle className="text-center">Merchant Services</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="mb-4">Accept payments seamlessly with our comprehensive merchant services and POS solutions.</p>
                <ul className="text-sm space-y-2 mb-6">
                  <li>✓ Credit card processing</li>
                  <li>✓ Mobile payment solutions</li>
                  <li>✓ Online payment gateway</li>
                  <li>✓ 24/7 customer support</li>
                </ul>
                <Button variant="outline" className="border-finora-accent text-finora-accent hover:bg-finora-accent hover:text-white">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Industry-Specific Solutions</h2>
            <p className="text-xl text-gray-600">
              Tailored banking services for your specific industry needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-store text-white text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Retail</h3>
              <p className="text-gray-600">POS integration and inventory financing</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-utensils text-white text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Restaurants</h3>
              <p className="text-gray-600">Equipment loans and cash management</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-hard-hat text-white text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Construction</h3>
              <p className="text-gray-600">Project financing and bonding</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-finora-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-laptop text-white text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Technology</h3>
              <p className="text-gray-600">Startup financing and venture solutions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Tools */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Digital Tools for Modern Business</h2>
              <p className="text-xl text-gray-600 mb-8">
                Manage your business finances efficiently with our comprehensive digital banking platform
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <i className="fas fa-chart-bar text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Cash Flow Management</h4>
                    <p className="text-gray-600">Real-time insights into your business finances</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-file-invoice text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Digital Invoicing</h4>
                    <p className="text-gray-600">Create and send professional invoices instantly</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="fas fa-users text-finora-primary text-2xl mr-4 mt-1"></i>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Team Access Controls</h4>
                    <p className="text-gray-600">Manage permissions for employees and accountants</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1553484771-371a605b060b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Business team working on digital tools" 
                className="rounded-lg shadow-lg w-full h-auto" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="bg-finora-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Dedicated Business Support</h2>
          <p className="text-xl mb-8">
            Our business banking specialists are here to help you succeed
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div>
              <i className="fas fa-phone text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p>Round-the-clock assistance when you need it</p>
            </div>
            <div>
              <i className="fas fa-handshake text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Relationship Managers</h3>
              <p>Dedicated advisors who understand your business</p>
            </div>
            <div>
              <i className="fas fa-graduation-cap text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Business Resources</h3>
              <p>Educational content and tools for growth</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}