'use client';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse">
          <div className="bg-gray-200 rounded-xl h-32 lg:h-40"></div>
        </div>
      ))}
    </div>
  );
}

