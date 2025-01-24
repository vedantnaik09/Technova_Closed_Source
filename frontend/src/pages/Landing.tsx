import { Link } from 'react-router-dom';
import { FaBrain, FaChartLine, FaCalendarCheck, FaUsers, FaRocket, FaShieldAlt, FaBolt, FaClock } from 'react-icons/fa';
import Navbar from '../components/Navbar';

const features = [
  {
    icon: <FaBrain className="w-6 h-6" />,
    title: "AI-Powered Insights",
    description: "Smart analysis of productivity patterns while maintaining privacy"
  },
  {
    icon: <FaChartLine className="w-6 h-6" />,
    title: "Workflow Optimization",
    description: "Actionable insights for task prioritization and workload balance"
  },
  {
    icon: <FaCalendarCheck className="w-6 h-6" />,
    title: "Smart Scheduling",
    description: "AI-recommended meeting times to maximize team focus"
  },
  {
    icon: <FaUsers className="w-6 h-6" />,
    title: "Team Collaboration",
    description: "Identify and resolve collaboration bottlenecks effectively"
  }
];

const benefits = [
  {
    icon: <FaRocket className="w-8 h-8" />,
    title: "30% Productivity Boost",
    description: "Teams report significant improvement in task completion rates"
  },
  {
    icon: <FaShieldAlt className="w-8 h-8" />,
    title: "Privacy First",
    description: "Enterprise-grade security with end-to-end encryption"
  },
  {
    icon: <FaBolt className="w-8 h-8" />,
    title: "Quick Integration",
    description: "Set up in minutes with your existing tools"
  },
  {
    icon: <FaClock className="w-8 h-8" />,
    title: "Time Recovery",
    description: "Save up to 5 hours per week per team member"
  }
];

const testimonials = [
  {
    quote: "TeamAI transformed how our remote team works. The AI insights are game-changing.",
    author: "Sarah Chen",
    role: "CTO at TechFlow",
    image: "https://randomuser.me/api/portraits/women/1.jpg"
  },
  {
    quote: "The productivity gains were immediate. Our team's efficiency improved by 40%.",
    author: "Michael Rodriguez",
    role: "Engineering Lead at Innovate Inc",
    image: "https://randomuser.me/api/portraits/men/2.jpg"
  },
  {
    quote: "Finally, a tool that actually helps reduce meeting overload!",
    author: "Emma Thompson",
    role: "Product Manager at Scale AI",
    image: "https://randomuser.me/api/portraits/women/3.jpg"
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent" />
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-block mb-4 px-4 py-1 bg-indigo-600/10 rounded-full">
            <span className="text-indigo-400">AI-Powered Team Productivity</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Boost Your Team's Productivity with
            <span className="gradient-text"> AI</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
            Transform your workspace with AI-driven insights, smart task management,
            and optimized team collaboration.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-primary">
              Start Free Trial
            </Link>
            <button className="btn-secondary">
              Watch Demo
            </button>
          </div>
          <div className="mt-12 p-8 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-4xl font-bold gradient-text mb-2">200+</h3>
                <p className="text-gray-400">Teams Empowered</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold gradient-text mb-2">40%</h3>
                <p className="text-gray-400">Productivity Increase</p>
              </div>
              <div>
                <h3 className="text-4xl font-bold gradient-text mb-2">5hrs</h3>
                <p className="text-gray-400">Saved per Week</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Features that Transform Your Workflow</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Our AI-powered platform provides everything you need to optimize your team's productivity
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-black rounded-xl border border-zinc-800 hover:border-indigo-600/50 transition-all duration-300">
                <div className="text-indigo-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Teams Choose TeamAI</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Join hundreds of teams already benefiting from our AI-powered productivity platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="p-8 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="text-indigo-400 mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by Teams Worldwide</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              See what our customers have to say about their experience with TeamAI
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-6 bg-black rounded-xl border border-zinc-800">
                <p className="text-gray-300 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold">{testimonial.author}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Team's Productivity?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join hundreds of teams already using TeamAI to work smarter, not harder.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/register" className="btn-primary">
              Start Free Trial
            </Link>
            <button className="btn-secondary">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-xl font-bold gradient-text">TeamAI</span>
              <p className="mt-4 text-gray-400">
                AI-powered productivity tools for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Use Cases</li>
                <li>Security</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API</li>
                <li>Community</li>
                <li>Support</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-zinc-800 text-center text-gray-400">
            <p>© 2024 TeamAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}