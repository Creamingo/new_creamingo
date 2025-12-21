'use client';

const ProductSkeleton = () => {
  return (
    <div className="w-full mx-auto px-3 sm:px-6 lg:px-12 xl:px-16 pt-2 sm:pt-4 lg:pt-2 pb-20 sm:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
          <div className="flex gap-2 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
          </div>

          {/* Price */}
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
          </div>

          {/* Variants */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse" />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;

