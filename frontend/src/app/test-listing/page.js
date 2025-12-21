// Test page to demonstrate ListingPage component usage
// This is for development/testing purposes only

import Link from 'next/link';

export default function TestListingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          ListingPage Component Test
        </h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Routes
          </h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Category Routes</h3>
              <div className="space-y-2">
                <Link 
                  href="/category/cakes-by-flavor"
                  className="block text-purple-600 hover:text-purple-800 transition-colors"
                >
                  /category/cakes-by-flavor
                </Link>
                <Link 
                  href="/category/cakes-for-occasion"
                  className="block text-purple-600 hover:text-purple-800 transition-colors"
                >
                  /category/cakes-for-occasion
                </Link>
                <Link 
                  href="/category/kids-cake-collection"
                  className="block text-purple-600 hover:text-purple-800 transition-colors"
                >
                  /category/kids-cake-collection
                </Link>
                <Link 
                  href="/category/crowd-favorite-cakes"
                  className="block text-purple-600 hover:text-purple-800 transition-colors"
                >
                  /category/crowd-favorite-cakes
                </Link>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">Subcategory Routes</h3>
              <div className="space-y-2">
                <Link 
                  href="/category/cakes-by-flavor/chocolate"
                  className="block text-purple-600 hover:text-purple-800 transition-colors"
                >
                  /category/cakes-by-flavor/chocolate
                </Link>
                <Link 
                  href="/category/cakes-by-flavor/red-velvet"
                  className="block text-purple-600 hover:text-purple-800 transition-colors"
                >
                  /category/cakes-by-flavor/red-velvet
                </Link>
                <Link 
                  href="/category/cakes-for-occasion/birthday"
                  className="block text-purple-600 hover:text-purple-800 transition-colors"
                >
                  /category/cakes-for-occasion/birthday
                </Link>
                <Link 
                  href="/category/kids-cake-collection/barbie-doll-cakes"
                  className="block text-purple-600 hover:text-purple-800 transition-colors"
                >
                  /category/kids-cake-collection/barbie-doll-cakes
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-medium text-purple-800 mb-2">Features to Test</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Website header and footer integration</li>
              <li>• Subcategory navigation section (for subcategory pages)</li>
              <li>• Dynamic subcategory data from database</li>
              <li>• Dynamic page titles and meta descriptions</li>
              <li>• Product grid with lazy loading</li>
              <li>• Wishlist functionality</li>
              <li>• Weight selector</li>
              <li>• Sorting options</li>
              <li>• Responsive design</li>
              <li>• Error handling</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-800 mb-2">New Features Added</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>✅ Header and LocationBar components</li>
              <li>✅ Subcategory navigation grid (shows all subcategories)</li>
              <li>✅ Dynamic subcategory fetching from API</li>
              <li>✅ Website footer with social links</li>
              <li>✅ Mobile footer for mobile users</li>
              <li>✅ Consistent styling with website theme</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
