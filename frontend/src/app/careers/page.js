'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Briefcase,
  Users,
  Heart,
  Award,
  TrendingUp,
  Coffee,
  Calendar,
  DollarSign,
  GraduationCap,
  Zap,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Star,
  Rocket,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const CareersPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    resume: null,
    message: ''
  });

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const whyWorkHere = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Passionate Team",
      description: "Work with a team that's genuinely passionate about creating memorable experiences through amazing cakes.",
      color: "from-pink-400 to-rose-500"
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Growth Opportunities",
      description: "Be part of a growing startup with endless opportunities for career advancement and skill development.",
      color: "from-blue-400 to-indigo-500"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Recognition & Rewards",
      description: "Your hard work and contributions are recognized and rewarded. Excellence is celebrated here.",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Collaborative Culture",
      description: "Join a supportive work environment where teamwork, creativity, and innovation are encouraged.",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Learning & Development",
      description: "Continuous learning opportunities with training programs, workshops, and mentorship support.",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Dynamic Work Environment",
      description: "Experience the excitement of working in a fast-paced startup where every day brings new challenges.",
      color: "from-red-400 to-pink-500"
    }
  ];

  const benefits = [
    "Competitive Salary Package",
    "Health Insurance Coverage",
    "Flexible Working Hours",
    "Paid Time Off & Holidays",
    "Professional Development Programs",
    "Employee Discounts",
    "Team Building Activities",
    "Performance Bonuses",
    "Work-Life Balance",
    "Mentorship Opportunities",
    "Career Growth Path",
    "Creative Freedom"
  ];

  const openPositions = [
    {
      title: "Senior Baker",
      department: "Production",
      type: "Full-time",
      location: "Gorakhpur, UP",
      description: "Lead our baking team and create exceptional cakes. Minimum 3 years experience required."
    },
    {
      title: "Frontend Developer",
      department: "Technology",
      type: "Full-time",
      location: "Remote / Gorakhpur",
      description: "Build beautiful, responsive web applications. React, Next.js experience preferred."
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      type: "Full-time",
      location: "Gorakhpur, UP",
      description: "Drive brand growth through innovative marketing strategies and campaigns."
    },
    {
      title: "Customer Service Representative",
      department: "Customer Service",
      type: "Full-time",
      location: "Gorakhpur, UP",
      description: "Be the voice of Creamingo. Help customers and create delightful experiences."
    },
    {
      title: "Sales Executive",
      department: "Sales",
      type: "Full-time",
      location: "Gorakhpur, UP",
      description: "Build relationships with customers and drive sales growth in your territory."
    },
    {
      title: "Graphic Designer",
      department: "Design",
      type: "Full-time",
      location: "Remote / Gorakhpur",
      description: "Create stunning visual designs for our products, marketing materials, and digital platforms."
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    alert('Thank you for your application! We will review it and get back to you soon.');
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      experience: '',
      resume: null,
      message: ''
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({...formData, resume: file});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <motion.section
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white py-10 overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.button
            variants={fadeInUp}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </motion.button>

          <motion.div variants={fadeInUp} className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <Briefcase className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Careers at Creamingo</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Join our passionate team and help us create moments of joy, one cake at a time. 
              Be part of something sweet!
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Why Work Here Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Why Work at Creamingo?
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {whyWorkHere.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-md dark:shadow-xl dark:shadow-black/20 hover:shadow-lg transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-700 group"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-8 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Perks & Benefits
            </motion.h2>

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors border-2 border-gray-100 dark:border-gray-700"
                >
                  <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                  <span className="text-base text-gray-700 dark:text-gray-300 font-medium">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Open Positions
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
              {openPositions.map((position, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{position.title}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full">{position.department}</span>
                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full">{position.type}</span>
                        <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-full">{position.location}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{position.description}</p>
                  <button
                    onClick={() => {
                      setFormData({...formData, position: position.title});
                      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-sm font-semibold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                  >
                    Apply Now →
                  </button>
                </motion.div>
              ))}
            </div>

            <motion.div
              variants={fadeInUp}
              className="mt-8 text-center"
            >
              <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
                Don't see a position that matches your skills?
              </p>
              <button
                onClick={() => {
                  document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white rounded-lg font-semibold hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-shadow"
              >
                Send Us Your Resume
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="bg-white dark:bg-gray-800 p-8 rounded-xl border-2 border-pink-200 dark:border-pink-800">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
                Our Work Culture
              </h2>
              <div className="space-y-4 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  At Creamingo, we believe that great products come from great teams. We've built a culture 
                  that values creativity, collaboration, and continuous learning. We're not just colleagues—we're 
                  a family working together to bring joy to our customers.
                </p>
                <p>
                  We celebrate diversity, encourage innovation, and support each other's growth. Whether you're 
                  in the kitchen crafting the perfect cake or behind a screen building our digital presence, 
                  your contribution matters and is valued.
                </p>
                <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">
                  Join us if you're ready to make an impact, grow professionally, and be part of something special.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Application Form Section */}
      <section id="application-form" className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Apply Now
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-center text-base text-gray-700 dark:text-gray-300 mb-8"
            >
              Fill out the form below to submit your application. We'll review it and get back to you within 3-5 business days.
            </motion.p>

            <motion.form
              variants={fadeInUp}
              onSubmit={handleSubmit}
              className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-8 rounded-xl border-2 border-pink-200 dark:border-pink-800"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Position Applied For *</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="e.g., Senior Baker, Frontend Developer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Years of Experience *</label>
                  <input
                    type="text"
                    required
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="e.g., 3 years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resume/CV *</label>
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-600 dark:file:bg-pink-700 file:text-white hover:file:bg-pink-700 dark:hover:file:bg-pink-600"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cover Letter / Additional Information</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-pink-500 dark:focus:border-pink-400 focus:outline-none transition-colors resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Tell us why you'd be a great fit for Creamingo..."
                ></textarea>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-700 dark:to-rose-700 text-white px-6 py-4 rounded-lg font-semibold text-lg shadow-lg dark:shadow-xl dark:shadow-black/30 hover:shadow-xl transition-shadow"
              >
                Submit Application
              </motion.button>
            </motion.form>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-8 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6"
            >
              Questions About Careers?
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                variants={fadeInUp}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-pink-200 dark:border-pink-800"
              >
                <Phone className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Call Us</h3>
                <a href="tel:+917570030333" className="text-base text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  +91-7570030333
                </a>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-pink-200 dark:border-pink-800"
              >
                <Mail className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Email Us</h3>
                <a href="mailto:careers@creamingo.com" className="text-base text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                  careers@creamingo.com
                </a>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-pink-200 dark:border-pink-800"
              >
                <MapPin className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Visit Us</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Asuran Chowk<br />Gorakhpur, Uttar Pradesh
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <MobileFooter />
    </div>
  );
};

export default CareersPage;

