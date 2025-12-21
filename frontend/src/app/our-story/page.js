'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Heart, Target, Award, Users, Cake } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const OurStoryPage = () => {
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
        staggerChildren: 0.2
      }
    }
  };

  const values = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Passion First",
      description: "Every cake is crafted with genuine love and attention to detail, making each celebration special."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Quality Promise",
      description: "We use only the finest ingredients and time-tested recipes to ensure every bite is perfect."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Excellence",
      description: "From traditional recipes to modern innovations, we never compromise on taste or presentation."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Community",
      description: "Building connections one celebration at a time, making memories that last forever."
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "The Beginning",
      description: "Creamingo was born from a small kitchen with a big dream—to bring joy to every celebration."
    },
    {
      year: "2021",
      title: "First Milestone",
      description: "Expanded our reach, serving hundreds of happy customers and making birthdays unforgettable."
    },
    {
      year: "2023",
      title: "Growing Strong",
      description: "Launched online platform, bringing fresh cakes directly to doorsteps across the city."
    },
    {
      year: "2025",
      title: "Today & Beyond",
      description: "Continuing to innovate and spread happiness, one delicious cake at a time."
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
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white rounded-full blur-3xl"></div>
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
              <h1 className="text-3xl md:text-4xl font-bold">Our Story</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Born from passion, built with love, delivered with joy.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Story Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Cake className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Where It All Began</h2>
              </div>
              <div className="space-y-4 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                  Born from a passion for creating moments of pure joy, Creamingo started with a simple dream: to make every celebration unforgettable with the freshest, most delectable cakes.
                </p>
                <p>
                  What began as a small kitchen experiment has grown into a trusted name, where art meets flavor. We believe every slice tells a story, and every celebration deserves perfection.
                </p>
                <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">
                  Today, we're not just bakers—we're memory makers, delivering happiness one cake at a time, right to your doorstep.
                </p>
              </div>
            </motion.div>

            {/* Mission Statement */}
            <motion.div variants={fadeInUp} className="mt-8 p-6 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 rounded-xl border-2 border-pink-200 dark:border-pink-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Our Mission</h3>
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                To transform every special moment into a delicious memory by crafting premium cakes with fresh ingredients, innovative designs, and unmatched dedication. We're committed to bringing smiles to faces and sweetness to celebrations, one perfectly baked cake at a time.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
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
              What Drives Us
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md dark:shadow-xl dark:shadow-black/20 hover:shadow-lg transition-shadow border-2 border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-700"
                >
                  <div className="text-pink-600 dark:text-pink-400 mb-3">{value.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
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
              Our Journey
            </motion.h2>

            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-500 to-orange-500 dark:from-pink-400 dark:to-orange-400"></div>

                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="relative pl-24 pb-6 last:pb-0"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute left-6 top-2 w-4 h-4 bg-gradient-to-br from-pink-500 to-orange-500 dark:from-pink-400 dark:to-orange-400 rounded-full border-4 border-white dark:border-gray-800 shadow-lg dark:shadow-xl dark:shadow-black/30"></div>

                    {/* Content */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border-2 border-gray-100 dark:border-gray-600 hover:border-pink-200 dark:hover:border-pink-700 transition-colors">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-xl font-bold text-pink-600 dark:text-pink-400">{milestone.year}</span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{milestone.title}</h3>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{milestone.description}</p>
                    </div>
                  </motion.div>
                ))}
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
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Join Us in Making Memories</h2>
            <p className="text-base md:text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Whether it's a birthday, anniversary, or just because—we're here to make your celebration extra special.
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

export default OurStoryPage;

