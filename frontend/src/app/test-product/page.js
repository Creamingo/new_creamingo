'use client';

import { useState, useEffect } from 'react';
import productApi from '../../api/productApi';

export default function TestProductPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Test the API with a known working slug
        const response = await productApi.getProductBySlug('floral-delight-cake-updated');
        
        if (response.success) {
          setProducts([response.data.product]);
          console.log('✅ API Test Successful:', response.data.product);
        } else {
          setError('API returned error: ' + response.message);
        }
      } catch (err) {
        console.error('❌ API Test Failed:', err);
        setError('API Test Failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p>Testing API connection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-4">API Test Failed</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-gray-600">
            <p>Check:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Backend server is running on port 5000</li>
              <li>Frontend server is running on port 3000</li>
              <li>No CORS issues</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Results</h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-green-800 mb-4">✅ API Connection Successful!</h2>
          <p className="text-green-700">The product API is working correctly.</p>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Test Product Data:</h2>
          
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">{product.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ID:</strong> {product.id}
                </div>
                <div>
                  <strong>Slug:</strong> {product.slug}
                </div>
                <div>
                  <strong>Price:</strong> ₹{product.base_price}
                </div>
                <div>
                  <strong>Rating:</strong> {product.rating || 'N/A'}
                </div>
                <div>
                  <strong>Category:</strong> {product.category_name}
                </div>
                <div>
                  <strong>Active:</strong> {product.is_active ? 'Yes' : 'No'}
                </div>
              </div>
              
              <div className="mt-4">
                <strong>Description:</strong>
                <p className="text-gray-600 mt-1">{product.description}</p>
              </div>
              
              <div className="mt-4">
                <a 
                  href={`/product/${product.slug}`}
                  className="inline-block bg-rose-500 text-white px-4 py-2 rounded-lg hover:bg-rose-600 transition-colors"
                >
                  View Product Page
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-4">Working Product URLs:</h3>
          <ul className="space-y-2 text-blue-700">
            <li><a href="/product/floral-delight-cake-updated" className="underline hover:no-underline">/product/floral-delight-cake-updated</a></li>
            <li><a href="/product/red-velvet-romance-cake" className="underline hover:no-underline">/product/red-velvet-romance-cake</a></li>
            <li><a href="/product/sprinkle-charm-cake" className="underline hover:no-underline">/product/sprinkle-charm-cake</a></li>
            <li><a href="/product/premium-chocolate-delight-cake-test-1" className="underline hover:no-underline">/product/premium-chocolate-delight-cake-test-1</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
