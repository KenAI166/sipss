import React, { useState } from 'react';

interface HomeProps {
  onNavigate: (view: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSent(false), 4000);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white shadow-sm z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => scrollTo('top')} className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-coffee text-white"></i>
            </div>
            <span className="text-xl font-bold text-black">Sip Station</span>
          </button>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <button onClick={() => scrollTo('top')} className="text-gray-600 hover:text-green-600 transition">Home</button>
            <button onClick={() => scrollTo('about')} className="text-gray-600 hover:text-green-600 transition">About Us</button>
            <button onClick={() => scrollTo('contact')} className="text-gray-600 hover:text-green-600 transition">Contact Us</button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('login')}
              className="text-green-600 hover:text-green-700 font-medium text-sm px-3 py-2"
            >
              Login
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="bg-green-500 hover:bg-green-600 text-white font-medium text-sm px-4 py-2 rounded-lg transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="top" className="bg-green-50">
        <div className="max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-mug-hot text-white text-3xl"></i>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Welcome to Sip Station Cafe
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Your daily dose of freshly brewed coffee and good vibes. Manage your
            cafe smarter with our point-of-sale and business management system.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-lg transition"
            >
              Get Started
            </button>
            <button
              onClick={() => scrollTo('about')}
              className="border border-green-500 text-green-600 hover:bg-green-50 font-medium px-6 py-3 rounded-lg transition"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-black text-center mb-4">About Us</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Sip Station Cafe is a cozy neighborhood coffee shop serving quality
            coffee, pastries, and smiles. Behind the counter, we run on our own
            POS &amp; business management system that handles sales, inventory,
            staff, and analytics.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-coffee text-green-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-black mb-2">Quality Coffee</h3>
              <p className="text-gray-600 text-sm">
                Freshly roasted beans brewed to perfection, every single cup.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-green-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-black mb-2">Smart Management</h3>
              <p className="text-gray-600 text-sm">
                Sales, inventory, payroll, and attendance — all in one dashboard.
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-heart text-green-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-black mb-2">Friendly Service</h3>
              <p className="text-gray-600 text-sm">
                A warm welcome and a great cup, every visit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="py-20 bg-green-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-black text-center mb-4">Contact Us</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Questions, feedback, or catering inquiries — we'd love to hear from you.
          </p>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-map-marker-alt text-green-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-black">Address</h4>
                  <p className="text-gray-600 text-sm">123 Coffee Street, Your City</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-phone text-green-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-black">Phone</h4>
                  <p className="text-gray-600 text-sm">+63 912 345 6789</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-envelope text-green-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-black">Email</h4>
                  <p className="text-gray-600 text-sm">hello@sipstation.cafe</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-clock text-green-600"></i>
                </div>
                <div>
                  <h4 className="font-semibold text-black">Hours</h4>
                  <p className="text-gray-600 text-sm">Mon–Sun, 7:00 AM – 9:00 PM</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {sent && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                  Message sent! We'll get back to you soon.
                </div>
              )}
              <form onSubmit={handleContact}>
                <div className="mb-4">
                  <label className="block text-black text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-black text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-black text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="How can we help?"
                    rows={4}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Sip Station Cafe &copy; {new Date().getFullYear()}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
