import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Brain, 
  FileText, 
  Zap, 
  Users, 
  Award,
  ArrowRight,
  Play,
  CheckCircle,
  Star
} from 'lucide-react';

interface LandingPageProps {
  onLogin: (userData: any) => void;
  onNavigate: (view: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onNavigate }) => {
  const handleLogin = () => {
    // Simulate login
    onLogin({ name: 'Dr. Smith', email: 'dr.smith@example.com' });
  };

  const handleDemo = () => {
    onNavigate('figure-analyzer');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SciFig AI
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors">Pricing</a>
              <button 
                onClick={handleDemo}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Demo
              </button>
              <button 
                onClick={handleLogin}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                Login
              </button>
              <button 
                onClick={handleLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Your Medical Data into{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Publication-Ready
              </span>{' '}
              Figures in Minutes
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              SciFig AI transforms how medical researchers create publication-ready analyses and figures, 
              making statistical analysis as simple as describing what you want to show.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <button 
              onClick={handleDemo}
              className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" />
              Try Demo
            </button>
            <button 
              onClick={handleLogin}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Upload Your Data
              <ArrowRight className="h-5 w-5" />
            </button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-8 mb-20"
          >
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <Zap className="h-12 w-12 text-blue-600 mb-4 mx-auto" />
              <h3 className="text-xl font-bold mb-2">T-Test in 30s</h3>
              <p className="text-gray-600">AI-powered analysis selection and execution</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <BarChart3 className="h-12 w-12 text-purple-600 mb-4 mx-auto" />
              <h3 className="text-xl font-bold mb-2">ANOVA Ready</h3>
              <p className="text-gray-600">Publication-ready figures with statistical annotations</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <FileText className="h-12 w-12 text-green-600 mb-4 mx-auto" />
              <h3 className="text-xl font-bold mb-2">Survival Curves</h3>
              <p className="text-gray-600">Complete methods sections for your papers</p>
            </div>
          </motion.div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <p className="text-lg text-gray-700 mb-4 italic">
              "SciFig AI saved me 2 weeks on my last paper. The AI recommendations were spot-on, 
              and the figures looked better than anything I could create manually."
            </p>
            <p className="font-semibold text-gray-900">- Dr. Sarah Chen, Johns Hopkins</p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Scientific Publishing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From data upload to publication-ready figures, SciFig AI handles the entire workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Analysis',
                description: 'Smart recommendations based on your data structure and research goals',
                color: 'text-blue-600'
              },
              {
                icon: CheckCircle,
                title: 'Assumption Checking',
                description: 'Automatic validation of statistical assumptions with alternative suggestions',
                color: 'text-green-600'
              },
              {
                icon: BarChart3,
                title: 'Publication-Ready Figures',
                description: 'Journal-specific formatting with proper statistical annotations',
                color: 'text-purple-600'
              },
              {
                icon: FileText,
                title: 'Methods Generation',
                description: 'Auto-generated methods sections following publication guidelines',
                color: 'text-orange-600'
              },
              {
                icon: Users,
                title: 'Collaboration Tools',
                description: 'Share projects, track changes, and collaborate with co-authors',
                color: 'text-pink-600'
              },
              {
                icon: Award,
                title: 'HIPAA Compliant',
                description: 'Secure data handling for medical research with enterprise-grade security',
                color: 'text-red-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 p-8 rounded-2xl hover:bg-gray-100 transition-colors"
              >
                <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Research Workflow?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of researchers who have already accelerated their publication timeline
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleLogin}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button 
              onClick={handleDemo}
              className="bg-transparent text-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105"
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">SciFig AI</span>
            </div>
            <p className="text-gray-400">© 2025 SciFig AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;