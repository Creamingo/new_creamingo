import ListingPage from '../../../../components/ListingPage';

export default function SubCategoryPage() {
  return <ListingPage />;
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { categorySlug, subCategorySlug } = params;
  
  // In a real app, you would fetch this from your API
  const mockSubcategories = {
    'cakes-by-flavor': {
      'chocolate': {
        title: 'Chocolate Cakes | Creamingo',
        description: 'Indulge in our premium chocolate cakes. Rich, moist, and absolutely delicious.',
      },
      'red-velvet': {
        title: 'Red Velvet Cakes | Creamingo',
        description: 'Classic red velvet cakes with our signature cream cheese frosting.',
      },
      'black-forest': {
        title: 'Black Forest Cakes | Creamingo',
        description: 'Authentic black forest cakes with layers of chocolate and cherries.',
      }
    },
    'cakes-for-occasion': {
      'birthday': {
        title: 'Birthday Cakes | Creamingo',
        description: 'Celebrate with our delicious birthday cakes. Custom designs available.',
      },
      'anniversary': {
        title: 'Anniversary Cakes | Creamingo',
        description: 'Celebrate your love with our romantic anniversary cakes.',
      },
      'wedding': {
        title: 'Wedding Cakes | Creamingo',
        description: 'Beautiful wedding cakes with custom designs for your special day.',
      }
    },
    'kids-cake-collection': {
      'barbie-doll-cakes': {
        title: 'Barbie Doll Cakes | Creamingo',
        description: 'Magical Barbie doll cakes that will make your little princess smile.',
      },
      'super-hero-cakes': {
        title: 'Super Hero Cakes | Creamingo',
        description: 'Super hero themed cakes for your little superhero\'s birthday.',
      },
      'cartoon-cakes': {
        title: 'Cartoon Cakes | Creamingo',
        description: 'Fun cartoon character cakes that bring joy to every celebration.',
      },
      'designer-cakes': {
        title: 'Designer Cakes | Creamingo',
        description: 'Artistic and custom-made designer cakes for special occasions.',
      },
      'number-cakes': {
        title: 'Number Cakes | Creamingo',
        description: 'Personalized number and alphabet cakes for milestone celebrations.',
      }
    }
  };

  const subcategoryData = mockSubcategories[categorySlug]?.[subCategorySlug] || {
    title: `${subCategorySlug} | Creamingo`,
    description: `Discover our premium collection of ${subCategorySlug} cakes.`,
  };

  return {
    title: subcategoryData.title,
    description: subcategoryData.description,
    openGraph: {
      title: subcategoryData.title,
      description: subcategoryData.description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: subcategoryData.title,
      description: subcategoryData.description,
    },
  };
}
