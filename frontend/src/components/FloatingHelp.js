'use client'

import { useState } from 'react'
import { HelpCircle, MessageCircle, Phone, MessageSquare, X } from 'lucide-react'

const FloatingHelp = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  const supportOptions = [
    { 
      icon: MessageCircle, 
      label: 'Live Chat', 
      action: () => window.open('/chat', '_blank'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    { 
      icon: Phone, 
      label: 'Call Us', 
      action: () => window.open('tel:+91-22-4343-3333', '_blank'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    { 
      icon: MessageSquare, 
      label: 'WhatsApp', 
      action: () => window.open('https://wa.me/919876543210', '_blank'),
      color: 'bg-green-600 hover:bg-green-700'
    }
  ]

  return (
    <div className="lg:hidden fixed bottom-20 right-4 z-40">
      {/* Support Options */}
      {isExpanded && (
        <div className="mb-3 space-y-2">
          {supportOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.action}
              className={`${option.color} text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center space-x-2`}
            >
              <option.icon className="w-5 h-5" />
              <span className="font-inter text-sm font-medium whitespace-nowrap">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Help Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`bg-gradient-to-r from-pink-500 to-orange-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
          isExpanded ? 'rotate-45' : ''
        }`}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <HelpCircle className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}

export default FloatingHelp
