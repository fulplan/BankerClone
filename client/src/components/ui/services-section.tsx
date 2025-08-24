export default function ServicesSection() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Helping people bank smarter</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-16 h-16 bg-santander-red rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-piggy-bank text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Savings & CDs</h3>
            <p className="text-gray-600 mb-4">that make it convenient to earn more as you save.</p>
            <a href="#" className="text-santander-red hover:underline">Learn more →</a>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-16 h-16 bg-santander-red rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Checking</h3>
            <p className="text-gray-600 mb-4">options for even easier everyday banking.</p>
            <a href="#" className="text-santander-red hover:underline">Learn more →</a>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <div className="w-16 h-16 bg-santander-red rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-credit-card text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Credit cards</h3>
            <p className="text-gray-600 mb-4">with a range of benefits and rewards.</p>
            <a href="#" className="text-santander-red hover:underline">Learn more →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
