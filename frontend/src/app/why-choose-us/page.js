'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  Heart, 
  Shield, 
  Truck, 
  Palette, 
  Star, 
  CheckCircle2,
  Clock,
  Award,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const WhyChooseUsPage = () => {
  const router = useRouter();

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

  const reasons = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast Delivery",
      description: "Same-day delivery available. Get your fresh cakes delivered right when you need them, without the wait.",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Made with Love",
      description: "Every cake is handcrafted with premium ingredients and genuine care, ensuring every bite is perfect.",
      color: "from-pink-400 to-rose-500"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Quality Guaranteed",
      description: "We use only the finest, freshest ingredients. No preservatives, no compromises—just pure, delicious quality.",
      color: "from-blue-400 to-indigo-500"
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Fresh Every Time",
      description: "Baked daily in our state-of-the-art kitchen. Your cake arrives fresh, never frozen or pre-made.",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Custom Designs",
      description: "From simple to extravagant, we bring your vision to life. Customize flavors, sizes, and decorations.",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Wide Variety",
      description: "Choose from hundreds of designs, flavors, and sizes. There's something perfect for every occasion.",
      color: "from-amber-400 to-orange-500"
    }
  ];

  const features = [
    "100% Fresh Ingredients",
    "Same Day Delivery Available",
    "Custom Designs Welcome",
    "Easy Online Ordering",
    "Secure Payment Options",
    "Trusted by Thousands",
    "24/7 Customer Support",
    "Satisfaction Guaranteed"
  ];

  const stats = [
    {
      number: "Daily",
      label: "Adding New Customers",
      icon: <Users className="w-6 h-6" />
    },
    {
      number: "100+",
      label: "Cake Varieties",
      icon: <Award className="w-6 h-6" />
    },
    {
      number: "24/7",
      label: "Available Support",
      icon: <Clock className="w-6 h-6" />
    },
    {
      number: "98%",
      label: "Satisfaction Rate",
      icon: <Star className="w-6 h-6" />
    }
  ];

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
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Why Choose Creamingo?</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Experience the perfect blend of quality, freshness, and convenience. Your celebrations deserve the best.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center p-6 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-800"
              >
                <div className="text-pink-600 dark:text-pink-400 mb-3 flex justify-center">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Reasons Section */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900">
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
              What Sets Us Apart
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reasons.map((reason, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md dark:shadow-xl dark:shadow-black/20 hover:shadow-lg transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-700 group"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${reason.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {reason.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{reason.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{reason.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features List Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
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
              Why Customers Love Us
            </motion.h2>

            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                  <span className="text-base text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonial/Trust Section */}
      <section className="py-8 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              We've been making celebrations special for years. Join thousands of satisfied customers who trust Creamingo for their most important moments.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border-2 border-pink-200 dark:border-pink-800 text-sm font-semibold text-gray-700 dark:text-gray-300">
                ✓ Verified Quality
              </div>
              <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border-2 border-pink-200 dark:border-pink-800 text-sm font-semibold text-gray-700 dark:text-gray-300">
                ✓ Safe & Secure
              </div>
              <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border-2 border-pink-200 dark:border-pink-800 text-sm font-semibold text-gray-700 dark:text-gray-300">
                ✓ Fast Delivery
              </div>
              <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-full border-2 border-pink-200 dark:border-pink-800 text-sm font-semibold text-gray-700 dark:text-gray-300">
                ✓ Happy Customers
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Experience Creamingo?</h2>
            <p className="text-base md:text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Browse our collection and discover why we're the preferred choice for celebrations across the city.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-6 py-3 rounded-lg font-semibold text-base shadow-lg dark:shadow-xl dark:shadow-black/30 hover:shadow-xl transition-shadow"
            >
              Explore Our Cakes
            </motion.button>
          </motion.div>
        </div>
      </section>

      <Footer />
      <MobileFooter />
    </div>
  );
};

export default WhyChooseUsPage;

