'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Shield,
  Lock,
  Eye,
  User,
  Database,
  Cookie,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import MobileFooter from '../../components/MobileFooter';

const PrivacyPage = () => {
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
        staggerChildren: 0.1
      }
    }
  };

  const privacySections = [
    {
      title: "1. Introduction",
      icon: <Info className="w-5 h-5" />,
      content: [
        "At Creamingo, we are committed to protecting your privacy and personal information.",
        "This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.",
        "By using our services, you consent to the data practices described in this policy."
      ]
    },
    {
      title: "2. Information We Collect",
      icon: <Database className="w-5 h-5" />,
      content: [
        "Personal Information: Name, email address, phone number, delivery address, and payment information.",
        "Order Information: Order history, preferences, and special requests.",
        "Technical Information: IP address, browser type, device information, and usage patterns.",
        "Communication Data: Records of your communications with us, including customer service interactions.",
        "Location Data: Delivery address and location information when you use location-based features."
      ]
    },
    {
      title: "3. How We Use Your Information",
      icon: <Eye className="w-5 h-5" />,
      content: [
        "To process and fulfill your orders, including delivery and customer service.",
        "To communicate with you about your orders, account, and our services.",
        "To send you promotional materials, newsletters, and marketing communications (with your consent).",
        "To improve our website, products, and services based on your feedback and usage patterns.",
        "To prevent fraud, enhance security, and comply with legal obligations.",
        "To personalize your experience and provide tailored recommendations."
      ]
    },
    {
      title: "4. Information Sharing and Disclosure",
      icon: <User className="w-5 h-5" />,
      content: [
        "We do not sell your personal information to third parties.",
        "We may share information with trusted service providers who assist in operations (payment processors, delivery partners, etc.).",
        "We may disclose information if required by law or to protect our rights and safety.",
        "In case of business transfers, your information may be transferred to the new entity.",
        "With your explicit consent for any other purpose not listed here."
      ]
    },
    {
      title: "5. Data Security",
      icon: <Lock className="w-5 h-5" />,
      content: [
        "We implement appropriate technical and organizational measures to protect your personal information.",
        "We use encryption, secure servers, and access controls to safeguard your data.",
        "However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
        "You are responsible for keeping your account credentials confidential."
      ]
    },
    {
      title: "6. Cookies and Tracking Technologies",
      icon: <Cookie className="w-5 h-5" />,
      content: [
        "We use cookies and similar tracking technologies to enhance your browsing experience.",
        "Cookies help us remember your preferences, analyze site traffic, and personalize content.",
        "You can control cookies through your browser settings, though this may affect site functionality.",
        "We use both session cookies (temporary) and persistent cookies (stored on your device)."
      ]
    },
    {
      title: "7. Your Rights and Choices",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "You have the right to access, update, or correct your personal information at any time.",
        "You can opt-out of marketing communications by clicking unsubscribe links or contacting us.",
        "You may request deletion of your account and personal data, subject to legal requirements.",
        "You can withdraw consent for data processing where applicable.",
        "To exercise these rights, please contact us using the information provided below."
      ]
    },
    {
      title: "8. Data Retention",
      icon: <Database className="w-5 h-5" />,
      content: [
        "We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy.",
        "Order and transaction records are typically retained for a minimum period required by law.",
        "Account information is retained while your account is active or as needed to provide services.",
        "We may retain certain information for legitimate business purposes or legal compliance."
      ]
    },
    {
      title: "9. Third-Party Links and Services",
      icon: <AlertCircle className="w-5 h-5" />,
      content: [
        "Our website may contain links to third-party websites or services.",
        "We are not responsible for the privacy practices of these external sites.",
        "We encourage you to review the privacy policies of any third-party sites you visit.",
        "Payment processing is handled by secure third-party providers with their own privacy policies."
      ]
    },
    {
      title: "10. Children's Privacy",
      icon: <Shield className="w-5 h-5" />,
      content: [
        "Our services are not directed to individuals under the age of 18.",
        "We do not knowingly collect personal information from children.",
        "If we become aware that we have collected information from a child, we will take steps to delete it promptly.",
        "Parents or guardians should monitor their children's online activities."
      ]
    },
    {
      title: "11. International Data Transfers",
      icon: <Eye className="w-5 h-5" />,
      content: [
        "Your information may be processed and stored in India or other countries where we operate.",
        "By using our services, you consent to the transfer of your information to these locations.",
        "We ensure appropriate safeguards are in place for data transfers."
      ]
    },
    {
      title: "12. Changes to This Privacy Policy",
      icon: <Info className="w-5 h-5" />,
      content: [
        "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.",
        "We will notify you of significant changes by posting the new policy on our website with an updated date.",
        "Continued use of our services after changes constitutes acceptance of the updated policy.",
        "We encourage you to review this policy periodically."
      ]
    },
    {
      title: "13. Contact Us",
      icon: <Mail className="w-5 h-5" />,
      content: [
        "If you have questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact us:",
        "Email: info@creamingo.com",
        "Phone: +91-7570030333",
        "Address: Asuran Chowk, Gorakhpur, Uttar Pradesh",
        "We will respond to your inquiry within a reasonable timeframe."
      ]
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
              <Lock className="w-6 h-6 text-yellow-300" />
              <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Your privacy matters to us. Learn how we collect, use, and protect your personal information.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Introduction Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20 p-8 rounded-xl border-2 border-pink-200 dark:border-pink-800">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Our Commitment to Privacy</h2>
                  <div className="space-y-4 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    <p>
                      At Creamingo, we take your privacy seriously. This Privacy Policy explains our practices 
                      regarding the collection, use, and protection of your personal information when you use 
                      our website and services.
                    </p>
                    <p>
                      We are committed to transparency and giving you control over your personal data. Please read 
                      this policy carefully to understand how we handle your information.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Privacy Sections */}
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
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8"
            >
              Privacy Policy Details
            </motion.h2>

            <div className="max-w-5xl mx-auto space-y-6">
              {privacySections.map((section, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-pink-200 dark:border-pink-800 hover:border-pink-300 dark:hover:border-pink-700 transition-colors"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-pink-600 dark:text-pink-400">{section.icon}</span>
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                        <CheckCircle2 className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Key Points Section */}
      <section className="py-8 bg-white dark:bg-gray-800">
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
              Your Privacy Rights Summary
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                variants={fadeInUp}
                className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-6 rounded-xl"
              >
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Access Your Data</h3>
                <p className="text-base text-gray-700 dark:text-gray-300">Request a copy of your personal information at any time.</p>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-6 rounded-xl"
              >
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Update Information</h3>
                <p className="text-base text-gray-700 dark:text-gray-300">Correct or update your personal data through your account settings.</p>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-6 rounded-xl"
              >
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Opt-Out</h3>
                <p className="text-base text-gray-700 dark:text-gray-300">Unsubscribe from marketing communications at any time.</p>
              </motion.div>

              <motion.div
                variants={fadeInUp}
                className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-6 rounded-xl"
              >
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Account</h3>
                <p className="text-base text-gray-700 dark:text-gray-300">Request deletion of your account and personal information.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Important Notice Section */}
      <section className="py-8 bg-gradient-to-br from-pink-50 to-orange-50 dark:from-pink-900/20 dark:to-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              variants={fadeInUp}
              className="bg-white dark:bg-gray-800 border-2 border-yellow-200 dark:border-yellow-800 p-6 rounded-xl"
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Important Notice</h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    This Privacy Policy is subject to change. We will notify you of any significant changes by 
                    posting the updated policy on our website with a revised date.
                  </p>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-8 bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 dark:from-pink-600 dark:via-rose-600 dark:to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <Shield className="w-12 h-12 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Questions About Privacy?
            </h2>
            <p className="text-lg text-white/90 leading-relaxed mb-6">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal 
              information, please contact our privacy team. We're here to help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:+917570030333"
                className="px-6 py-3 bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded-lg font-semibold hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30 transition-shadow flex items-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call: +91-7570030333
              </a>
              <a
                href="mailto:info@creamingo.com"
                className="px-6 py-3 bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 dark:hover:bg-gray-800/50 transition-colors border-2 border-white/30 dark:border-gray-700/50 flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Email Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <MobileFooter />
    </div>
  );
};

export default PrivacyPage;

