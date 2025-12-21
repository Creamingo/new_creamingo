import { useState } from 'react'
import { availableWeights } from '../components/cakeData'

export const useWeightManagement = () => {
  const [productWeights, setProductWeights] = useState({})

  const updateWeight = (productId, direction) => {
    const currentWeight = productWeights[productId] || 1
    const currentIndex = availableWeights.findIndex(w => w.weight === currentWeight)
    
    if (direction === 'increase' && currentIndex < availableWeights.length - 1) {
      const newWeight = availableWeights[currentIndex + 1].weight
      setProductWeights(prev => ({
        ...prev,
        [productId]: newWeight
      }))
    } else if (direction === 'decrease' && currentIndex > 0) {
      const newWeight = availableWeights[currentIndex - 1].weight
      setProductWeights(prev => ({
        ...prev,
        [productId]: newWeight
      }))
    }
  }

  const formatWeight = (weight) => {
    const weightData = availableWeights.find(w => w.weight === weight)
    return weightData ? weightData.label : `${weight}kg`
  }

  const getCurrentPrice = (product) => {
    const currentWeight = productWeights[product.id] || 1
    const basePrice = product.discountedPrice
    const pricePerKg = basePrice // Base price is for 1kg
    const currentPrice = pricePerKg * currentWeight
    return currentPrice
  }

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `₹${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`
    }
    return price
  }

  const canDecreaseWeight = (productId) => {
    const currentWeight = productWeights[productId] || 1
    const currentIndex = availableWeights.findIndex(w => w.weight === currentWeight)
    return currentIndex > 0
  }

  const canIncreaseWeight = (productId) => {
    const currentWeight = productWeights[productId] || 1
    const currentIndex = availableWeights.findIndex(w => w.weight === currentWeight)
    return currentIndex < availableWeights.length - 1
  }

  return {
    productWeights,
    updateWeight,
    formatWeight,
    getCurrentPrice,
    formatPrice,
    canDecreaseWeight,
    canIncreaseWeight
  }
}
