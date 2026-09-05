import React, { useState } from 'react';
import {
  Coffee,
  Croissant,
  BarChart3,
  HeartHandshake,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Sparkles,
  Leaf,
  Send,
} from 'lucide-react';
import Login from './Login';

interface HomeProps {
  onNavigate: (view: string) => void;
  onLogin: (username: string, password: string) => Promise<string | null>;
}

const Home: React.FC<HomeProps> = ({ onNavigate, onLogin }) => {
  const [authMode, setAuthMode] = useState<'login' | null>(null);
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

  const features = [
    {
      icon: Coffee,
      title: 'Quality Coffee',
      text: 'Freshly roasted beans brewed to perfection, every single cup.',
    },
    {
      icon: BarChart3,
      title: 'Smart Management',
      text: 'Sales, inventory, payroll, and attendance — all in one dashboard.',
    },
    {
      icon: HeartHandshake,
      title: 'Friendly Service',
      text: 'A warm welcome and a great cup, every visit.',
    },
  ];

  const contactItems = [
    { icon: MapPin, label: 'Address', value: '123 Coffee Street, Your City' },
    { icon: Phone, label: 'Phone', value: '+63 912 345 6789' },
    { icon: Mail, label: 'Email', value: 'hello@sipstation.cafe' },
    { icon: Clock, label: 'Hours', value: 'Mon–Sun, 7:00 AM – 9:00 PM' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e8] md:p-6">
      <div className="relative mx-auto max-w-7xl bg-[#fdfbf6] md:rounded-3xl md:shadow-xl md:border md:border-stone-200 overflow-hidden">
        {/* Navbar */}
        <nav className="sticky top-0 bg-[#fdfbf6]/90 backdrop-blur border-b border-stone-200 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => scrollTo('top')} className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
                <Coffee className="w-5 h-5 text-amber-50" />
              </div>
              <span className="font-display text-xl font-semibold text-stone-900">Sip Station</span>
            </button>
            <div className="hidden md:flex items-center gap-7 text-sm font-medium">
              <button onClick={() => scrollTo('top')} className="text-stone-500 hover:text-emerald-700 transition">Home</button>
              <button onClick={() => scrollTo('about')} className="text-stone-500 hover:text-emerald-700 transition">About Us</button>
              <button onClick={() => scrollTo('contact')} className="text-stone-500 hover:text-emerald-700 transition">Contact Us</button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthMode('login')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold text-sm px-3 py-2"
              >
                Login
              </button>

            </div>
          </div>
        </nav>

        {/* Hero */}
        <section id="top" className="relative overflow-hidden">
          {/* soft background blobs */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row md:items-center gap-12">
            <div className={`w-full ${authMode ? 'md:w-3/5' : 'md:w-3/5'}`}>
              <div className="fade-up inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Your neighborhood cafe
              </div>
              <h1 className="fade-up fade-up-delay-1 font-display text-5xl md:text-6xl font-bold text-stone-900 leading-[1.05] mb-6">
                Fresh brews,<br />
                <span className="italic text-emerald-800">warm vibes.</span>
              </h1>
              <p className="fade-up fade-up-delay-2 text-stone-600 text-lg max-w-xl mb-8">
                Sip Station Cafe serves quality coffee and runs on its own
                point-of-sale &amp; business management system — sales, inventory,
                staff, and analytics in one place.
              </p>
              <div className="fade-up fade-up-delay-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setAuthMode('login')}
                  className="group inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-amber-50 font-semibold px-6 py-3 rounded-full transition shadow-md"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => scrollTo('about')}
                  className="border border-stone-300 text-stone-700 hover:border-emerald-700 hover:text-emerald-800 font-semibold px-6 py-3 rounded-full transition"
                >
                  Learn More
                </button>
              </div>

              <div className="fade-up fade-up-delay-3 mt-10 flex items-center gap-6 text-sm text-stone-500">
                <span className="inline-flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-700" /> Locally roasted
                </span>
                <span className="inline-flex items-center gap-2">
                  <Croissant className="w-4 h-4 text-emerald-700" /> Baked daily
                </span>
              </div>
            </div>

            {/* Right side: decorative card, swaps to auth form when opened */}
            <div className="w-full md:w-2/5">
              {authMode ? (
                <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden auth-slide-in">
                  <Login
                    embedded
                    onLogin={onLogin}
                    onClose={() => setAuthMode(null)}
                  />
                </div>
              ) : (
                <div className="fade-up fade-up-delay-2 relative">
                  <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-10 text-center shadow-xl rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="w-24 h-24 bg-amber-50/10 border border-amber-50/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Coffee className="w-12 h-12 text-amber-200" />
                    </div>
                    <p className="font-display text-2xl text-amber-50 italic mb-2">Est. daily</p>
                    <p className="text-emerald-200/80 text-sm">Brewed with care, served with a smile.</p>
                  </div>
                  <div className="absolute -top-4 -left-4 bg-white shadow-md border border-stone-200 rounded-full px-4 py-2 text-xs font-semibold text-stone-700 -rotate-6">
                    ☕ Open 7 AM – 9 PM
                  </div>
                  <div className="absolute -bottom-4 -right-2 bg-white shadow-md border border-stone-200 rounded-full px-4 py-2 text-xs font-semibold text-stone-700 rotate-3">
                    Fresh pastries daily
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* About Us */}
        <section id="about" className="py-20 border-t border-stone-200">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-emerald-700 font-semibold text-sm tracking-widest uppercase text-center mb-3">About Us</p>
            <h2 className="font-display text-4xl font-bold text-stone-900 text-center mb-4">
              More than just a cafe
            </h2>
            <p className="text-stone-600 text-center max-w-2xl mx-auto mb-14">
              Sip Station Cafe is a cozy neighborhood coffee shop serving quality
              coffee, pastries, and smiles. Behind the counter, we run on our own
              POS &amp; business management system that handles sales, inventory,
              staff, and analytics.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-emerald-700 transition-colors duration-300">
                    <f.icon className="w-7 h-7 text-emerald-700 group-hover:text-amber-50 transition-colors duration-300" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-stone-900 mb-2">{f.title}</h3>
                  <p className="text-stone-600 text-sm leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Us */}
        <section id="contact" className="py-20 bg-[#f8f3ea] border-t border-stone-200">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-emerald-700 font-semibold text-sm tracking-widest uppercase text-center mb-3">Contact Us</p>
            <h2 className="font-display text-4xl font-bold text-stone-900 text-center mb-4">
              Say hello
            </h2>
            <p className="text-stone-600 text-center max-w-2xl mx-auto mb-14">
              Questions, feedback, or catering inquiries — we'd love to hear from you.
            </p>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                {contactItems.map((c) => (
                  <div key={c.label} className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-white border border-stone-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <c.icon className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900">{c.label}</h4>
                      <p className="text-stone-600 text-sm">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow-md border border-stone-200 p-8">
                {sent && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-4 text-sm">
                    Message sent! We'll get back to you soon.
                  </div>
                )}
                <form onSubmit={handleContact}>
                  <div className="mb-4">
                    <label className="block text-stone-800 text-sm font-semibold mb-1.5">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-[#fdfbf6]"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-stone-800 text-sm font-semibold mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-[#fdfbf6]"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block text-stone-800 text-sm font-semibold mb-1.5">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-[#fdfbf6]"
                      placeholder="How can we help?"
                      rows={4}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-amber-50 font-semibold py-3 px-4 rounded-full transition shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#fdfbf6] border-t border-stone-200 py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-stone-500 text-sm">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-emerald-700" />
              <span className="font-display font-semibold text-stone-800">Sip Station</span>
            </div>
            <p>Sip Station Cafe &copy; {new Date().getFullYear()}. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
