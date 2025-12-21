'use client';

export default function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 lg:py-16">
      {Icon && (
        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400" />
        </div>
      )}
      <h3 className="font-poppins text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="font-inter text-sm text-gray-600 text-center max-w-md mb-6">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-inter text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-sm hover:shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

