import React from 'react';
import Footer from './Footer';

/**
 * Example usage of the Creamingo Footer component
 * 
 * This component demonstrates how to integrate the Footer into your application.
 * Make sure you have Framer Motion installed: npm install framer-motion
 */
const FooterExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Your main content goes here */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Creamingo Website
        </h1>
        <p className="text-gray-600 mb-8">
          This is an example page showing how the Footer component integrates with your content.
          The footer will appear at the bottom of the page with all the specified features.
        </p>
        
        {/* Add some content to demonstrate the footer positioning */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Fresh Cakes</h3>
            <p className="text-gray-600">Delicious cakes baked fresh daily with premium ingredients.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Fast Delivery</h3>
            <p className="text-gray-600">Same-day delivery available for your special occasions.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Custom Designs</h3>
            <p className="text-gray-600">Personalized cakes designed just for your celebrations.</p>
          </div>
        </div>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default FooterExample;
