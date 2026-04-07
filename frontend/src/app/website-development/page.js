'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Globe,
  IndianRupee,
  Layers3,
  MessageCircle,
  Rocket,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const websiteTypes = [
  { id: 'ecommerce', title: 'E-commerce Website', subtitle: 'Sell products online' },
  { id: 'business', title: 'Business Website', subtitle: 'Show services and get leads' },
  { id: 'portfolio', title: 'Portfolio Website', subtitle: 'Showcase your work' },
  { id: 'landing', title: 'Landing Page', subtitle: 'Run ads and collect leads' }
];

const packagePlans = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 'Starting from ₹999/mo',
    oneTime: 'Starting from ₹9,999',
    timeline: '7-12 days',
    stackNote: 'Lightweight stack (HTML/WordPress/Laravel-ready)',
    features: ['Up to 5 pages', 'Mobile responsive', 'Contact form + WhatsApp', 'Basic on-page SEO']
  },
  {
    id: 'growth',
    name: 'Professional',
    monthly: 'Starting from ₹4,999/mo',
    oneTime: '₹49,999',
    timeline: '12-18 days',
    stackNote: 'Modern React/Next.js experience',
    features: ['Up to 10 pages', 'Advanced UI design', 'Lead tracking integrations', 'Speed optimization + SEO setup'],
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    monthly: 'Starting from ₹8,999/mo',
    oneTime: '₹89,999',
    timeline: '18-30 days',
    stackNote: 'Next.js + APIs + custom backend',
    features: ['Custom features + APIs', 'Advanced animations', 'Conversion funnel setup', 'Priority support + maintenance']
  }
];

const requirementOptions = {
  pages: [
    { label: '1-5 pages', value: 0 },
    { label: '6-10 pages', value: 8000 },
    { label: '11-20 pages', value: 17000 }
  ],
  features: [
    { label: 'Contact Form + WhatsApp', value: 2000 },
    { label: 'Booking System', value: 8000 },
    { label: 'Payment Integration', value: 12000 },
    { label: 'Blog / CMS', value: 7000 }
  ],
  style: [
    { label: 'Minimal', value: 0 },
    { label: 'Modern', value: 5000 },
    { label: 'Bold & Premium', value: 9000 }
  ],
  budget: ['Under ₹30k', '₹30k-₹60k', '₹60k+']
};

const portfolioItems = [
  { name: 'Urban Bake House', type: 'E-commerce', result: 'Delivered in 6 days' },
  { name: 'Prism Dental Care', type: 'Business', result: '2.2x lead enquiries' },
  { name: 'Aria Interiors', type: 'Portfolio', result: 'Delivered in 5 days' }
];

const testimonials = [
  { name: 'Ritika Sharma', quote: 'Super smooth process. The site looked premium and started getting enquiries quickly.' },
  { name: 'Nikhil Agarwal', quote: 'Clear pricing, fast delivery, and great support after launch.' },
  { name: 'Ayaan Khan', quote: 'Exactly what we needed for our ad campaigns and WhatsApp leads.' }
];

const faqs = [
  { q: 'How long does it take to build a website?', a: 'Most websites are delivered in 5-12 days depending on scope and feedback speed.' },
  { q: 'Do you help with domain and hosting?', a: 'Yes, we can assist with domain, hosting setup, SSL, and deployment.' },
  { q: 'Can I edit content later?', a: 'Yes. We provide editable sections and a quick handover guide.' },
  { q: 'What are the payment terms?', a: 'Usually 50% to start, 50% before launch. Monthly plans are billed at the start of each cycle.' }
];

const getBasePriceByType = (type) => {
  const map = {
    ecommerce: 22999,
    business: 7999,
    portfolio: 8999,
    landing: 6999
  };
  return map[type] || 7999;
};

export default function WebsiteDevelopmentPage() {
  const planMinimumPrice = {
    starter: 9999,
    growth: 49999,
    premium: 89999
  };

  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [selectedType, setSelectedType] = useState('business');
  const [billingType, setBillingType] = useState('oneTime');
  const [selectedPages, setSelectedPages] = useState('1-5 pages');
  const [selectedFeatures, setSelectedFeatures] = useState(['Contact Form + WhatsApp']);
  const [selectedStyle, setSelectedStyle] = useState('Minimal');
  const [selectedBudget, setSelectedBudget] = useState('₹30k-₹60k');
  const [openFaq, setOpenFaq] = useState(0);
  const [isMobileEstimateVisible, setIsMobileEstimateVisible] = useState(true);
  const [isMobileEstimateOpen, setIsMobileEstimateOpen] = useState(false);

  const estimatedPrice = useMemo(() => {
    const pageCost = requirementOptions.pages.find((item) => item.label === selectedPages)?.value || 0;
    const featuresCost = selectedFeatures.reduce((sum, feature) => {
      const item = requirementOptions.features.find((entry) => entry.label === feature);
      return sum + (item?.value || 0);
    }, 0);
    const styleCost = requirementOptions.style.find((item) => item.label === selectedStyle)?.value || 0;

    const computedPrice = getBasePriceByType(selectedType) + pageCost + featuresCost + styleCost;
    const selectedPlanMinimum = planMinimumPrice[selectedPlan] || 9999;

    return Math.max(9999, computedPrice, selectedPlanMinimum);
  }, [selectedPlan, selectedType, selectedPages, selectedFeatures, selectedStyle]);

  const toggleFeature = (feature) => {
    setIsMobileEstimateVisible(true);
    setIsMobileEstimateOpen(false);
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((item) => item !== feature) : [...prev, feature]
    );
  };

  const applyPlanPreset = (planId) => {
    setIsMobileEstimateVisible(true);
    setIsMobileEstimateOpen(false);
    setSelectedPlan(planId);

    if (planId === 'starter') {
      setSelectedType('business');
      setSelectedPages('1-5 pages');
      setSelectedFeatures(['Contact Form + WhatsApp']);
      setSelectedStyle('Minimal');
      setSelectedBudget('Under ₹30k');
      return;
    }

    if (planId === 'growth') {
      setSelectedType('business');
      setSelectedPages('6-10 pages');
      setSelectedFeatures(['Contact Form + WhatsApp', 'Booking System', 'Blog / CMS']);
      setSelectedStyle('Modern');
      setSelectedBudget('₹30k-₹60k');
      return;
    }

    setSelectedType('ecommerce');
    setSelectedPages('11-20 pages');
    setSelectedFeatures(['Contact Form + WhatsApp', 'Booking System', 'Payment Integration', 'Blog / CMS']);
    setSelectedStyle('Bold & Premium');
    setSelectedBudget('₹60k+');
  };

  return (
    <div className="min-h-screen bg-[#FFF5F2] text-[#1A1A1A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Website Development Services',
            serviceType: 'Website Design and Development',
            provider: {
              '@type': 'Organization',
              name: 'Creamingo',
              url: 'https://creamingo.com'
            },
            areaServed: {
              '@type': 'Country',
              name: 'India'
            },
            description:
              'Custom website development services for business websites, e-commerce stores, portfolios, and landing pages.',
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock'
            },
            url: 'https://creamingo.com/website-development'
          })
        }}
      />
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#FFF5F2] to-white pt-14 sm:pt-20 pb-14 sm:pb-16 lg:pt-32">
        <div className="absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-[#E53935]/20 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-72 w-72 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-white/70 bg-white/75 p-5 sm:p-7 lg:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E53935]/30 bg-[#FFE8E4] px-4 py-1 text-sm font-semibold text-[#C62828]">
              <Sparkles className="w-4 h-4" />
              Trendy websites that convert
            </span>
            <h1 className="mt-5 text-[28px] sm:text-4xl md:text-6xl font-extrabold leading-[1.08] text-slate-900 break-words">
              Get your website designed in days, not weeks.
            </h1>
            <p className="mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-[#555]">
              Custom, fast, and <span className="font-semibold text-[#C62828]">conversion-focused</span> websites for businesses that want clarity, speed, and real growth.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 sm:gap-4">
              <a href="#requirement-builder" className="inline-flex items-center gap-2 rounded-full bg-[#C62828] px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-red-200 hover:bg-[#E53935] transition-all">
                Start Your Website <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-slate-700 hover:border-slate-400 transition-colors">
                View Pricing
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-4 text-xs sm:text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1"><Clock3 className="w-4 h-4 text-[#C62828]" /> Delivery in 5-30 days</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1"><BadgeCheck className="w-4 h-4 text-[#C62828]" /> 50+ websites completed</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1"><Globe className="w-4 h-4 text-[#C62828]" /> Mobile-first and SEO-ready</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">What do you need?</h2>
          <p className="text-slate-600 mb-10">Choose one to get a more accurate recommendation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {websiteTypes.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedType(item.id)}
                className={`rounded-2xl p-5 text-left border transition-all hover:-translate-y-1 ${
                  selectedType === item.id
                    ? 'border-[#E53935] bg-gradient-to-br from-[#FFF5F2] to-[#FFE8E4] shadow-xl shadow-red-100'
                    : 'border-slate-200 bg-white hover:border-[#E53935]/40 hover:shadow-lg'
                }`}
              >
                <p className="text-lg font-semibold leading-tight">{item.title}</p>
                <p className="text-slate-600 text-sm leading-snug mt-1">{item.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-10 sm:py-14 lg:py-20 bg-gradient-to-b from-[#FFF5F2] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight">Simple, transparent pricing</h2>
              <p className="text-slate-600 mt-1 sm:mt-2">Pick what fits your current business stage.</p>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              <button onClick={() => setBillingType('monthly')} className={`px-4 py-2 rounded-lg ${billingType === 'monthly' ? 'bg-[#C62828] text-white' : 'text-slate-600'}`}>Monthly</button>
              <button onClick={() => setBillingType('oneTime')} className={`px-4 py-2 rounded-lg ${billingType === 'oneTime' ? 'bg-[#C62828] text-white' : 'text-slate-600'}`}>One-time</button>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-4 sm:mb-6">
            Final price depends on selected requirements, feature depth, and timeline.
          </p>
          <div className="mb-5 sm:mb-8 rounded-2xl border border-[#E53935]/20 bg-[#FFE8E4]/70 p-3 sm:p-4">
            <p className="text-sm text-slate-700">
              We choose the right technology based on your budget and requirements to deliver the best performance and value.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {packagePlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border p-4 sm:p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
                  selectedPlan === plan.id
                    ? 'border-[#E53935] ring-2 ring-[#E53935]/30 bg-gradient-to-br from-[#FFF5F2] to-[#FFE8E4] shadow-lg shadow-red-100'
                    : plan.popular
                      ? 'border-[#E53935]/50 bg-gradient-to-br from-[#FFF5F2] to-[#FFE8E4] shadow-lg shadow-red-100'
                      : 'border-slate-200 bg-white hover:border-[#E53935]/40'
                }`}
              >
                {plan.popular && <span className="inline-block rounded-full bg-[#C62828] px-3 py-1 text-xs font-semibold text-white mb-4">Most Popular</span>}
                <h3 className="text-2xl font-bold leading-tight">{plan.name}</h3>
                <p className="mt-1.5 text-sm leading-snug text-slate-600">{plan.stackNote}</p>
                <p className="mt-2.5 text-3xl font-bold leading-none">{billingType === 'monthly' ? plan.monthly : plan.oneTime}</p>
                <p className="text-slate-600 mt-1.5">Timeline: {plan.timeline}</p>
                <ul className="mt-3.5 sm:mt-5 space-y-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="inline-flex items-start gap-2 leading-snug text-slate-700">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#E53935]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    applyPlanPreset(plan.id);
                    const target = document.getElementById('requirement-builder');
                    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`mt-4 sm:mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:py-3 font-semibold transition-colors ${
                    selectedPlan === plan.id
                      ? 'bg-[#C62828] text-white hover:bg-[#E53935]'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Choose this'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="requirement-builder" className="py-14 sm:py-16 lg:py-20 border-y border-slate-200 bg-gradient-to-b from-white to-[#FFF5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold">Live requirement builder</h2>
          <p className="text-slate-600 mt-2 mb-8">Select options and get an instant estimated range.</p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="font-semibold mb-3">1) Number of pages</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {requirementOptions.pages.map((option) => (
                    <button key={option.label} onClick={() => { setSelectedPages(option.label); setIsMobileEstimateVisible(true); setIsMobileEstimateOpen(false); }} className={`rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 border ${selectedPages === option.label ? 'border-[#E53935] bg-[#FFE8E4]' : 'border-slate-300 bg-white'}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="font-semibold mb-3">2) Required features</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {requirementOptions.features.map((feature) => (
                    <button key={feature.label} onClick={() => toggleFeature(feature.label)} className={`rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 border ${selectedFeatures.includes(feature.label) ? 'border-[#E53935] bg-[#FFE8E4]' : 'border-slate-300 bg-white'}`}>
                      {feature.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="font-semibold mb-3">3) Design style</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {requirementOptions.style.map((option) => (
                    <button key={option.label} onClick={() => { setSelectedStyle(option.label); setIsMobileEstimateVisible(true); setIsMobileEstimateOpen(false); }} className={`rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 border ${selectedStyle === option.label ? 'border-[#E53935] bg-[#FFE8E4]' : 'border-slate-300 bg-white'}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <p className="font-semibold mb-3">4) Budget range</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {requirementOptions.budget.map((option) => (
                    <button key={option} onClick={() => { setSelectedBudget(option); setIsMobileEstimateVisible(true); setIsMobileEstimateOpen(false); }} className={`rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 border ${selectedBudget === option ? 'border-[#E53935] bg-[#FFE8E4]' : 'border-slate-300 bg-white'}`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden lg:block rounded-2xl border border-[#E53935]/20 bg-gradient-to-br from-[#C62828] to-[#E53935] p-5 sm:p-6 h-fit lg:sticky lg:top-28 text-white shadow-xl shadow-red-200">
              <p className="text-sm text-red-50">Estimated project cost</p>
              <p className="mt-2 text-4xl font-bold inline-flex items-center"><IndianRupee className="w-7 h-7" />{estimatedPrice.toLocaleString('en-IN')}</p>
              <p className="mt-2 text-sm text-cyan-50">Based on your selected requirements.</p>
              <ul className="mt-5 space-y-2 text-sm text-white">
                <li className="inline-flex items-center gap-2"><Layers3 className="w-4 h-4 text-red-50" />{selectedPages}</li>
                <li className="inline-flex items-center gap-2"><Star className="w-4 h-4 text-red-50" />{selectedStyle} design</li>
                <li className="inline-flex items-center gap-2"><Rocket className="w-4 h-4 text-red-50" />{selectedFeatures.length} feature(s) selected</li>
              </ul>
              <a
                href={`https://wa.me/917570030333?text=${encodeURIComponent(`Hi Creamingo, I need a ${selectedType} website. Estimated budget ${selectedBudget}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-[#C62828] hover:bg-red-50"
              >
                Discuss on WhatsApp <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Portfolio highlights</h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:snap-none md:pb-0 md:mx-0 md:px-0">
            {portfolioItems.map((item) => (
              <div
                key={item.name}
                className="min-w-[86%] sm:min-w-[70%] snap-start rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-[#FFF5F2] to-[#FFE8E4] p-5 transition-all hover:-translate-y-1 hover:shadow-lg md:min-w-0"
              >
                <div className="mb-3 h-1.5 w-14 rounded-full bg-gradient-to-r from-[#C62828] to-[#E53935]" />
                <p className="text-sm text-[#C62828]">{item.type}</p>
                <h3 className="text-xl font-semibold leading-tight mt-2">{item.name}</h3>
                <p className="text-slate-600 leading-snug mt-3">{item.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">What clients say</h2>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:snap-none md:pb-0 md:mx-0 md:px-0">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="min-w-[86%] sm:min-w-[70%] snap-start rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-[#FFF5F2] to-[#FFE8E4] p-5 shadow-sm md:min-w-0"
              >
                <div className="mb-3 h-1.5 w-14 rounded-full bg-gradient-to-r from-[#C62828] to-[#E53935]" />
                <p className="text-slate-700 leading-relaxed">"{item.quote}"</p>
                <p className="mt-4 font-semibold text-[#C62828]">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">How we work</h2>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="absolute left-7 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#E53935] via-[#D4AF37] to-[#E53935] md:hidden" />
            {['Share Requirement', 'Get Proposal', 'Design & Feedback', 'Launch'].map((step, idx) => (
              <div key={step} className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-[#FFF5F2] p-5 pl-14 md:pl-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute left-4 top-5 md:static md:mb-3 w-7 h-7 rounded-full bg-gradient-to-br from-[#C62828] to-[#E53935] text-white text-xs font-bold flex items-center justify-center shadow-md">
                  {idx + 1}
                </div>
                <p className="text-sm text-[#C62828] font-medium">Step {idx + 1}</p>
                <p className="mt-1 text-lg font-semibold leading-tight">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16 lg:py-20 border-y border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((item, index) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white">
                <button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="w-full p-5 flex items-center justify-between text-left">
                  <span className="font-semibold">{item.q}</span>
                  {openFaq === index ? <ChevronUp className="w-5 h-5 text-[#C62828]" /> : <ChevronDown className="w-5 h-5 text-[#C62828]" />}
                </button>
                {openFaq === index && <p className="px-5 pb-5 text-slate-600">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="final-cta" className="py-14 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-[#E53935]/20 bg-gradient-to-br from-[#C62828] via-[#E53935] to-[#B71C1C] p-8 text-white shadow-xl shadow-red-200">
            <p className="text-red-50 font-semibold">Limited slots this week</p>
            <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">Start your website today</h2>
            <p className="mt-3 text-cyan-50">Share your requirement and get a tailored proposal quickly.</p>
            <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Your name" className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-400" />
              <input type="tel" placeholder="Phone number" className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-400" />
              <input type="text" placeholder="Business type" className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-400 md:col-span-2" />
              <textarea placeholder="Tell us your requirement" rows={4} className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-400 md:col-span-2" />
              <button type="button" className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-[#C62828] hover:bg-red-50">
                Submit Requirement <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <a
        href="#final-cta"
        className="hidden sm:inline-flex fixed bottom-24 right-4 z-50 items-center gap-2 rounded-full bg-[#C62828] px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-lg shadow-red-200 hover:bg-[#E53935]"
      >
        Get Quote
      </a>

      {/* Mobile slide-up estimated cost panel */}
      {isMobileEstimateVisible && <div className="lg:hidden fixed left-0 right-0 bottom-16 z-50 px-3">
        <div className="rounded-2xl border border-[#E53935]/20 bg-white shadow-xl">
          <button
            type="button"
            onClick={() => setIsMobileEstimateOpen((prev) => !prev)}
            className="w-full px-4 py-3 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-xs text-slate-500">Estimated project cost</p>
              <p className="text-2xl font-bold text-[#C62828] inline-flex items-center"><IndianRupee className="w-5 h-5" />{estimatedPrice.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex items-center gap-2">
              {isMobileEstimateOpen ? <ChevronDown className="w-5 h-5 text-[#C62828]" /> : <ChevronUp className="w-5 h-5 text-[#C62828]" />}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileEstimateVisible(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMobileEstimateVisible(false);
                  }
                }}
                className="inline-flex items-center justify-center rounded-md p-1 text-[#C62828] hover:bg-red-50"
                aria-label="Close estimated project cost panel"
              >
                <X className="w-4 h-4" />
              </span>
            </div>
          </button>

          {isMobileEstimateOpen && (
            <div className="px-4 pb-4 border-t border-slate-200">
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                <li className="inline-flex items-center gap-2"><Layers3 className="w-4 h-4 text-[#C62828]" />{selectedPages}</li>
                <li className="inline-flex items-center gap-2"><Star className="w-4 h-4 text-[#C62828]" />{selectedStyle} design</li>
                <li className="inline-flex items-center gap-2"><Rocket className="w-4 h-4 text-[#C62828]" />{selectedFeatures.length} feature(s) selected</li>
              </ul>
              <a
                href={`https://wa.me/917570030333?text=${encodeURIComponent(`Hi Creamingo, I need a ${selectedType} website. Estimated budget ${selectedBudget}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C62828] px-4 py-2.5 font-semibold text-white hover:bg-[#E53935]"
              >
                Discuss on WhatsApp <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>}

      <Footer />
      <MobileFooter />
    </div>
  );
}
