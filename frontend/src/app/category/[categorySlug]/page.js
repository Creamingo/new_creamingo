import ListingPage from '../../../components/ListingPage';

export default function CategoryPage() {
  return <ListingPage />;
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { categorySlug } = params;
  
  // In a real app, you would fetch this from your API
  const mockCategories = {
    'cakes-by-flavor': {
      title: 'Cakes by Flavor | Creamingo',
      description: 'Explore our collection of cakes organized by flavor. From chocolate to vanilla, find your perfect cake.',
    },
    'cakes-for-occasion': {
      title: 'Cakes for Any Occasion | Creamingo',
      description: 'Find the perfect cake for birthdays, anniversaries, weddings and more special occasions.',
    },
    'kids-cake-collection': {
      title: "Kid's Cake Collection | Creamingo",
      description: 'Adorable cakes designed especially for kids. Barbie, superhero, and cartoon themed cakes.',
    },
    'crowd-favorite-cakes': {
      title: 'Crowd-Favorite Cakes | Creamingo',
      description: 'Discover our most popular cakes including photo cakes, pinata cakes, and fondant designs.',
    },
    'love-relationship-cakes': {
      title: 'Love and Relationship Cakes | Creamingo',
      description: 'Express your love with our special relationship cakes for family and loved ones.',
    },
    'milestone-year-cakes': {
      title: 'Cakes for Every Milestone Year | Creamingo',
      description: 'Celebrate every milestone with our special milestone cakes for birthdays and anniversaries.',
    },
    'small-treats-desserts': {
      title: 'Small Treats & Desserts | Creamingo',
      description: 'Indulge in our collection of pastries, cupcakes, brownies, and other sweet treats.',
    },
    'flowers': {
      title: 'Flowers | Creamingo',
      description: 'Beautiful flower arrangements and floral cakes to brighten any occasion.',
    },
    'sweets-dry-fruits': {
      title: 'Sweets and Dry Fruits | Creamingo',
      description: 'Premium collection of traditional sweets and dry fruits for special celebrations.',
    }
  };

  const categoryData = mockCategories[categorySlug] || {
    title: 'Cakes | Creamingo',
    description: 'Discover our premium collection of delicious cakes.',
  };

  return {
    title: categoryData.title,
    description: categoryData.description,
    openGraph: {
      title: categoryData.title,
      description: categoryData.description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: categoryData.title,
      description: categoryData.description,
    },
  };
}
