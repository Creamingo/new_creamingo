'use client';

export default function SectionHeader({ title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 pb-4 border-b border-gray-200/60">
      <div>
        <h2 className="font-poppins text-[16px] lg:text-[17px] font-semibold text-gray-900 mb-1.5 leading-tight">
          {title}
        </h2>
        {description && (
          <p className="font-inter text-sm text-gray-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg font-inter text-sm font-medium hover:from-pink-600 hover:to-rose-600 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

