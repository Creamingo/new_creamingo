import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TableColumn, PaginationProps } from '../../types';

interface TableProps<T> {
  data: T[];
  columns: TableColumn[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onSort,
  sortKey,
  sortDirection,
  className
}: TableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    
    if (sortKey === key) {
      onSort(key, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'asc');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full overflow-hidden', className)}>
      <div className="w-full overflow-x-auto -mx-1 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="w-full table-auto min-w-[640px] sm:min-w-0">
          <thead className="bg-gradient-to-r from-gray-50 via-gray-50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : {}}
                  className={cn(
                    'px-4 py-3.5 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider',
                    column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150',
                    // Promo codes table specific widths with proper alignment
                    column.key === 'code' ? 'w-[100px] min-w-[100px]' :
                    column.key === 'description' ? 'w-[150px] min-w-[150px] max-w-[150px]' :
                    column.key === 'discount' ? 'w-[120px] min-w-[120px]' :
                    column.key === 'min_order_amount' ? 'w-[90px] min-w-[90px]' :
                    column.key === 'usage' ? 'w-[80px] min-w-[80px]' :
                    column.key === 'validity' ? 'w-[110px] min-w-[110px]' :
                    column.key === 'status' ? 'w-[90px] min-w-[90px]' :
                    column.key === 'actions' ? 'w-[140px] min-w-[140px]' :
                    // Set specific widths for different column types
                    column.key === 'image_url' ? 'w-20' :
                    column.key === 'name' ? 'w-48' :
                    column.key === 'subcategories' ? 'w-32' :
                    column.key === 'is_active' ? 'w-32' :
                    column.key === 'created_at' ? 'w-28' :
                    // Users table specific widths
                    column.key === 'role' ? 'w-40' :
                    column.key === 'last_login' ? 'w-32' : ''
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={cn(
                    'flex items-center gap-2',
                    column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'
                  )}>
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col flex-shrink-0">
                        <ChevronUp
                          className={cn(
                            'h-3 w-3',
                            sortKey === column.key && sortDirection === 'asc'
                              ? 'text-primary-500 dark:text-primary-400'
                              : 'text-gray-300 dark:text-gray-600'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'h-3 w-3 -mt-1',
                            sortKey === column.key && sortDirection === 'desc'
                              ? 'text-primary-500 dark:text-primary-400'
                              : 'text-gray-300 dark:text-gray-600'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 border-b border-gray-100 dark:border-gray-700/50 group"
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      style={column.width ? { width: column.width } : {}}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-900 dark:text-gray-100 align-middle',
                        column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left',
                        // Allow text wrapping for description and other text columns
                        column.key === 'description' || column.key === 'items' || column.key === 'customer' || column.key === 'customerName' ? 'whitespace-normal break-words' : 'whitespace-nowrap'
                      )}
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : item[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

export function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 px-4 md:px-6 py-4">
        {/* Results Count - Mobile: Full width centered, Desktop: Left */}
        <div className="text-xs md:text-sm text-gray-700 dark:text-gray-300 font-semibold text-center md:text-left w-full md:w-auto">
          Showing <span className="font-bold text-gray-900 dark:text-white">{startItem}</span> to <span className="font-bold text-gray-900 dark:text-white">{endItem}</span> of <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> results
        </div>
        
        {/* Pagination Controls - Mobile: Full width with horizontal scroll, Desktop: Right */}
        <div className="flex items-center justify-center gap-1.5 md:gap-2 w-full md:w-auto overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2.5 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[75px] md:min-w-[80px] flex-shrink-0 shadow-sm hover:shadow-md"
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1 md:gap-1.5 overflow-x-auto md:overflow-visible scrollbar-hide">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...'}
                className={cn(
                  'px-3 py-2.5 text-xs md:text-sm font-semibold rounded-lg min-w-[38px] md:min-w-[40px] h-[38px] md:h-[40px] flex items-center justify-center flex-shrink-0 transition-all shadow-sm',
                  page === currentPage
                    ? 'bg-primary-500 text-white shadow-md hover:shadow-lg scale-105'
                    : page === '...'
                    ? 'text-gray-500 dark:text-gray-400 cursor-default px-1 shadow-none'
                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md'
                )}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2.5 text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[75px] md:min-w-[80px] flex-shrink-0 shadow-sm hover:shadow-md"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
