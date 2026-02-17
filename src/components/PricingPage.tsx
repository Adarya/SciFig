import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Check,
  X,
  Zap,
  Crown,
  Building,
  Star,
  Users,
  Shield,
  Headphones,
  Clock,
  BarChart3,
  FileText,
  Download,
  Globe
} from 'lucide-react';

interface PricingPageProps {
  onNavigate: NavigateFunction;
  onSelectPlan?: (plan: string) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onNavigate, onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      icon: Zap,
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for getting started with basic statistical analysis',
      features: [
        '5 analyses per month',
        'Basic statistical tests (t-test, ANOVA)',
        'Standard figure templates',
        'PNG/JPG export',
        'Email support',
        'Basic data upload (CSV)',
        'Community forum access'
      ],
      limitations: [
        'No advanced tests',
        'No custom styling',
        'No collaboration features',
        'No priority support'
      ],
      cta: 'Get Started Free',
      popular: false,
      color: 'gray'
    },
    {
      id: 'pro',
      name: 'Professional',
      icon: Crown,
      price: { monthly: 29, annual: 290 },
      description: 'For researchers who need advanced features and unlimited analyses',
      features: [
        'Unlimited analyses',
        'All statistical tests (survival, regression, etc.)',
        'Advanced figure customization',
        'All export formats (PNG, SVG, PDF, EPS)',
        'Priority email support',
        'Multiple data formats (Excel, SPSS, R)',
        'Collaboration tools',
        'Version history',
        'Custom journal templates',
        'Methods text generation',
        'Statistical assumption checking',
        'Effect size calculations'
      ],
      limitations: [],
      cta: 'Start Pro Trial',
      popular: true,
      color: 'blue'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Building,
      price: { monthly: 99, annual: 990 },
      description: 'For institutions and teams requiring advanced security and support',
      features: [
        'Everything in Professional',
        'Team management (up to 50 users)',
        'HIPAA compliance',
        'SSO integration',
        'Advanced security controls',
        'Dedicated account manager',
        '24/7 phone support',
        'Custom integrations',
        'API access',
        'Advanced analytics dashboard',
        'Custom training sessions',
        'Priority feature requests',
        'On-premise deployment option'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false,
      color: 'purple'
    }
  ];

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use enterprise-grade encryption and security measures. Your data is processed locally in your browser when possible, and we\'re HIPAA compliant for medical research.'
    },
    {
      question: 'Do you offer academic discounts?',
      answer: 'Yes! We offer 50% discounts for students and academic researchers. Contact us with your .edu email for verification.'
    },
    {
      question: 'What file formats do you support?',
      answer: 'We support CSV, Excel (.xlsx, .xls), SPSS (.sav), R data files (.rds), and more. Pro and Enterprise plans include additional format support.'
    },
    {
      question: 'Can I export my figures for publication?',
      answer: 'Yes! All plans include high-resolution exports. Pro and Enterprise plans offer additional formats like SVG, PDF, and EPS for publication-ready figures.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! Professional plan includes a 14-day free trial with full access to all features. No credit card required to start.'
    }
  ];

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'button') => {
    const colors = {
      gray: {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        button: 'bg-gray-600 hover:bg-gray-700'
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        button: 'bg-purple-600 hover:bg-purple-700'
      }
    };
    
    return colors[color as keyof typeof colors][variant];
  };

  const handleSelectPlan = (planId: string) => {
    if (onSelectPlan) {
      onSelectPlan(planId);
    } else {
      // Default behavior - could integrate with payment processor
      console.log(`Selected plan: ${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => onNavigate('landing')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Pricing</h1>
            <div className="w-16" /> {/* Spacer */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your Research Plan
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              From basic statistical analysis to enterprise-grade research platforms, 
              we have the perfect plan for your needs.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingCycle === 'annual' ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
                Annual
              </span>
              {billingCycle === 'annual' && (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  Save 17%
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const PlanIcon = plan.icon;
            const price = plan.price[billingCycle];
            const originalPrice = billingCycle === 'annual' ? plan.price.monthly * 12 : null;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-lg border-2 p-8 ${
                  plan.popular ? 'border-blue-500' : 'border-gray-200'
                } ${plan.popular ? 'scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>Most Popular</span>
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 ${getColorClasses(plan.color, 'bg')} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <PlanIcon className={`h-8 w-8 ${getColorClasses(plan.color, 'text')}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">${price}</span>
                      {price > 0 && (
                        <span className="text-gray-500 ml-1">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'annual' && originalPrice && (
                      <div className="text-sm text-gray-500 mt-1">
                        <span className="line-through">${originalPrice}/year</span>
                        <span className="text-green-600 ml-2">Save ${originalPrice - price}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-medium text-gray-700 mb-3">Not included:</h5>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li key={limitIndex} className="flex items-start space-x-3">
                            <X className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-500 text-sm">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${getColorClasses(plan.color, 'button')}`}
                >
                  {plan.cta}
                </button>

                {plan.id === 'pro' && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    14-day free trial • No credit card required
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Compare All Features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">Features</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Free</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Professional</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { feature: 'Monthly Analyses', free: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
                  { feature: 'Statistical Tests', free: 'Basic', pro: 'All Tests', enterprise: 'All Tests' },
                  { feature: 'Export Formats', free: 'PNG/JPG', pro: 'All Formats', enterprise: 'All Formats' },
                  { feature: 'Collaboration', free: '✗', pro: '✓', enterprise: '✓' },
                  { feature: 'Priority Support', free: '✗', pro: '✓', enterprise: '✓' },
                  { feature: 'Team Management', free: '✗', pro: '✗', enterprise: '✓' },
                  { feature: 'HIPAA Compliance', free: '✗', pro: '✗', enterprise: '✓' },
                  { feature: 'API Access', free: '✗', pro: '✗', enterprise: '✓' }
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{row.feature}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{row.free}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{row.pro}</td>
                    <td className="py-4 px-6 text-center text-gray-700">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Trusted by Researchers Worldwide
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <Users className="h-8 w-8 text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900">10,000+</div>
              <div className="text-sm text-gray-600">Active Researchers</div>
            </div>
            <div className="flex flex-col items-center">
              <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900">500,000+</div>
              <div className="text-sm text-gray-600">Analyses Completed</div>
            </div>
            <div className="flex flex-col items-center">
              <FileText className="h-8 w-8 text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900">25,000+</div>
              <div className="text-sm text-gray-600">Papers Published</div>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="h-8 w-8 text-orange-600 mb-2" />
              <div className="text-2xl font-bold text-gray-900">150+</div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;