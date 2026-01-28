'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, ChevronRight, X, CheckCircle, Navigation, AlertCircle, Loader2, ShoppingBag } from 'lucide-react'
import { usePinCode } from '../contexts/PinCodeContext'
import { useToast } from '../contexts/ToastContext'

const LocationBar = ({ isSticky = true }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [pincode, setPincode] = useState('')
  const { showError } = useToast()
  const toastShownRef = useRef(false)
  const locationTextRef = useRef(null)
  const [isTextTruncated, setIsTextTruncated] = useState(false)
  
  const {
    currentPinCode,
    deliveryInfo,
    isChecking,
    error,
    isValidPinCode,
    tempPinCode,
    tempValidationStatus,
    tempDeliveryInfo,
    checkPinCode,
    clearPinCode,
    validatePinCodeDebounced,
    confirmTempPinCode,
    getFormattedDeliveryCharge,
    getDeliveryLocality,
    getTempFormattedDeliveryCharge,
    getTempDeliveryLocality,
    isDeliveryAvailable,
    formatPinCode
  } = usePinCode()

  // Update local pincode state when context changes
  useEffect(() => {
    setPincode(currentPinCode)
  }, [currentPinCode])

  // Check if location text is truncated
  useEffect(() => {
    const checkTruncation = () => {
      if (locationTextRef.current) {
        const element = locationTextRef.current
        const isTruncated = element.scrollWidth > element.clientWidth
        setIsTextTruncated(isTruncated)
      }
    }

    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(checkTruncation, 0)
    
    // Recheck on window resize
    window.addEventListener('resize', checkTruncation)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', checkTruncation)
    }
  }, [deliveryInfo, currentPinCode])

  const handlePincodeSubmit = async () => {
    if (pincode.length === 6) {
      const success = await checkPinCode(pincode)
      if (success) {
        setIsExpanded(false)
      }
      // Toast is already shown via useEffect when tempValidationStatus becomes 'invalid'
    }
  }

  // Show toast when pincode becomes invalid (only once per invalid status)
  useEffect(() => {
    if (pincode.length === 6 && tempValidationStatus === 'invalid' && !toastShownRef.current) {
      showError(
        "Delivery not available",
        "Delivery isn't available at this pincode yet - we're expanding soon!",
        2000 // Duration: 2 seconds
      )
      toastShownRef.current = true
    }
    // Reset toast flag when pincode changes or status becomes valid
    if (tempValidationStatus !== 'invalid' || pincode.length !== 6) {
      toastShownRef.current = false
    }
  }, [tempValidationStatus, pincode.length, showError])

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(value)
    validatePinCodeDebounced(value)
  }

  const handleClearPinCode = () => {
    clearPinCode()
    setPincode('')
    setIsExpanded(false)
  }

  const handleContinueShopping = async () => {
    console.log('Continue Shopping clicked');
    console.log('Current state:', { pincode, tempValidationStatus, tempPinCode });
    const success = await confirmTempPinCode()
    console.log('Confirmation result:', success);
    if (success) {
      setIsExpanded(false)
    }
  }

  // Allow external components to open this panel (e.g., Product page "Change" button)
  useEffect(() => {
    const openHandler = () => setIsExpanded(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('open-pincode-modal', openHandler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-pincode-modal', openHandler)
      }
    }
  }, [])

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => {
        document.removeEventListener('keydown', handleEscapeKey)
      }
    }
  }, [isExpanded])

  return (
    <>
      {/* Location Bar - Sticky or scrollable based on prop (mobile only) */}
      <div className={`lg:hidden ${isSticky ? 'sticky top-[3.6rem] z-40' : 'relative z-30'} bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 ease-in-out`}>
        <div 
          className="flex items-center justify-between px-4 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 gap-1"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-5 h-5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Navigation className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex flex-col min-w-0 flex-1 max-w-[calc(100vw-6rem)]">
              {isDeliveryAvailable() ? (
                <>
                  <span className="font-inter text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    Delivering to {formatPinCode(currentPinCode)}
                  </span>
                  <div className="flex items-center gap-0.5 min-w-0">
                    <span 
                      ref={locationTextRef}
                      className="font-inter text-xs text-gray-600 dark:text-gray-400 truncate tracking-tight"
                    >
                      {getDeliveryLocality()}
                    </span>
                    <span className="font-inter text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                      {!isTextTruncated && '… '}+ nearby
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className="font-inter text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    Where to deliver?
                  </span>
                  <span className="font-inter text-xs text-gray-600 dark:text-gray-400 truncate">
                    Enter your pincode
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            {isDeliveryAvailable() ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <>
                <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Modal Overlay - Dimmed Backdrop */}
      {isExpanded && (
        <>
          {/* Backdrop - Dimmed Background (below header only) */}
          <div 
            className="fixed top-[3.6rem] left-0 right-0 bottom-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsExpanded(false)}
          />
          
          {/* Pincode Modal Container */}
          <div 
            className="fixed top-[3.6rem] left-0 right-0 z-50 lg:hidden"
            style={{ maxHeight: 'calc(100vh - 3.6rem)' }}
          >
            <div className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-2xl dark:shadow-black/30 mx-0 rounded-b-2xl overflow-hidden">
              {/* Header Section */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-inter text-base font-semibold text-gray-900 dark:text-gray-100">
                        {isDeliveryAvailable() ? 'Change Delivery Location' : 'Enter your pincode'}
                      </h3>
                      {!isDeliveryAvailable() && (
                        <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Add your location to get started
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content Section */}
              <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                <div className="space-y-3">
                  <div className="relative">
                    <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={pincode}
                      onChange={handlePincodeChange}
                      placeholder="Enter 6-digit pincode"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-inter text-sm font-medium tracking-wide bg-white dark:bg-gray-700 text-left transition-colors ${
                        tempValidationStatus === 'valid' 
                          ? 'border-green-300 dark:border-green-600 focus:ring-green-500 dark:focus:ring-green-600 focus:border-green-500 dark:focus:border-green-600 text-gray-900 dark:text-gray-100' 
                          : tempValidationStatus === 'invalid' 
                          ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-600 focus:border-red-500 dark:focus:border-red-600 text-gray-900 dark:text-gray-100' 
                          : 'border-gray-300 dark:border-gray-600 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      maxLength={6}
                      autoFocus
                    />
                    {tempValidationStatus === 'checking' && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 animate-spin" />
                    )}
                    {tempValidationStatus === 'valid' && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                    {tempValidationStatus === 'invalid' && (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  
                  {pincode.length === 6 && tempValidationStatus === 'valid' && (
                    <button
                      onClick={handleContinueShopping}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-inter text-sm font-medium hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-2 border border-green-600"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Continue Shopping</span>
                    </button>
                  )}
                  
                  {pincode.length === 6 && tempValidationStatus === 'invalid' && (
                    <button
                      disabled={true}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-inter text-sm font-medium cursor-not-allowed opacity-70 border border-red-600 flex items-center justify-center space-x-2"
                    >
                      <span>Try Another Pincode</span>
                    </button>
                  )}
                  
                  {pincode.length === 6 && (tempValidationStatus === 'checking' || tempValidationStatus === null) && (
                    <button
                      disabled={true}
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 py-3 rounded-lg font-inter text-sm font-medium cursor-not-allowed border border-gray-200 dark:border-gray-600"
                    >
                      {tempValidationStatus === 'checking' ? 'Checking...' : 'Enter PIN Code'}
                    </button>
                  )}

                  {/* Show temporary success message for new PIN code */}
                  {tempValidationStatus === 'valid' && tempDeliveryInfo && pincode !== currentPinCode && (
                    <div className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div className="flex-1">
                        <p className="font-inter text-sm text-gray-900 dark:text-gray-100 font-medium">
                          Great! We deliver to this area too. 🎉
                        </p>
                        <p className="font-inter text-xs text-gray-600 dark:text-gray-400">
                          {getTempDeliveryLocality()} (… + nearby) • {getTempFormattedDeliveryCharge()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isValidPinCode === false && (
                    <>
                      <div className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-700/50 border border-red-200 dark:border-red-800/50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span className="font-inter text-sm text-red-700 dark:text-red-400">
                          {error || "Sorry, we don't deliver to this pincode yet."}
                        </span>
                      </div>
                      <button
                        disabled={true}
                        className="w-full bg-red-600 text-white py-3 rounded-lg font-inter text-sm font-medium cursor-not-allowed opacity-70 border border-red-600"
                      >
                        Try Another Pincode
                      </button>
                    </>
                  )}
                  
                  {isDeliveryAvailable() && (
                    <button
                      onClick={handleClearPinCode}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-inter text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200"
                    >
                      Clear Location
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default LocationBar
