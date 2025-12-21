'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useWallet } from '../contexts/WalletContext';
import scratchCardApi from '../api/scratchCardApi';

const ScratchCard = ({ scratchCard, onRevealed, onCredited, showAutoCreditMessage = false }) => {
  const { showSuccess, showError } = useToast();
  const { fetchBalance } = useWallet();
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevealed, setIsRevealed] = useState(scratchCard.status === 'revealed' || scratchCard.status === 'credited');
  const [revealedAmount, setRevealedAmount] = useState(scratchCard.status === 'revealed' || scratchCard.status === 'credited' ? scratchCard.amount : null);
  const [isScratching, setIsScratching] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null); // Reference to the gradient container
  const [scratchProgress, setScratchProgress] = useState(0);
  const [hasStartedScratching, setHasStartedScratching] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const lastPointRef = useRef({ x: null, y: null });
  const isDrawingRef = useRef(false);
  const progressCheckRef = useRef(null);
  const confettiRef = useRef([]);
  const particlesRef = useRef([]);
  const shineAnimationRef = useRef(null);
  const textureCanvasRef = useRef(null);
  const isRevealingRef = useRef(false); // Track if reveal is in progress to prevent multiple calls

  // Helper function to get point from event - fixed for proper coordinate calculation
  const getPointFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    
    const dpr = window.devicePixelRatio || 1;
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calculate display coordinates (CSS pixels)
    const displayX = clientX - rect.left;
    const displayY = clientY - rect.top;

    // Ensure coordinates are within canvas bounds
    if (displayX < 0 || displayX > rect.width || displayY < 0 || displayY > rect.height) {
      return null;
    }

    return {
      x: displayX * dpr, // For internal canvas coordinates
      y: displayY * dpr,  // For internal canvas coordinates
      displayX: displayX, // For drawing (context is already scaled)
      displayY: displayY  // For drawing (context is already scaled)
    };
  };

  // Create trendy gold/chrome scratch texture - modern premium look
  const createMetallicTexture = (ctx, width, height) => {
    // Trendy gold-to-chrome gradient base
    const baseGradient = ctx.createLinearGradient(0, 0, width, height);
    baseGradient.addColorStop(0, '#FFD700'); // Gold
    baseGradient.addColorStop(0.15, '#FFA500'); // Orange-gold
    baseGradient.addColorStop(0.3, '#FFD700'); // Gold
    baseGradient.addColorStop(0.45, '#FFF8DC'); // Cream
    baseGradient.addColorStop(0.6, '#FFD700'); // Gold
    baseGradient.addColorStop(0.75, '#FFA500'); // Orange-gold
    baseGradient.addColorStop(0.9, '#FFF8DC'); // Cream
    baseGradient.addColorStop(1, '#FFD700'); // Gold
    
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle chrome-like radial shine - more professional
    const radialGradient = ctx.createRadialGradient(
      width * 0.3, height * 0.3, 0, 
      width * 0.5, height * 0.5, Math.max(width, height) * 1.8
    );
    radialGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    radialGradient.addColorStop(0.15, 'rgba(255, 255, 255, 0.3)');
    radialGradient.addColorStop(0.3, 'rgba(255, 255, 200, 0.2)');
    radialGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
    radialGradient.addColorStop(0.7, 'rgba(255, 165, 0, 0.08)');
    radialGradient.addColorStop(1, 'rgba(255, 215, 0, 0.15)');
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, width, height);

    // Trendy noise/grain texture - fine metallic grain
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Fine grain texture for trendy metallic look
      const noise = (Math.random() - 0.5) * 35;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 0.9)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 0.8)); // B
    }
    
    ctx.putImageData(imageData, 0, 0);

    // Subtle brushed metal effect - diagonal brushed lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    for (let i = -height; i < width + height; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + height, height);
      ctx.stroke();
    }

    // Subtle sparkle highlights - professional look
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle reflective highlights - professional chrome effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 4 + 2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Very subtle holographic effect - minimal rainbow shimmer
    const holographicGradient = ctx.createLinearGradient(0, 0, width, height);
    holographicGradient.addColorStop(0, 'rgba(255, 0, 150, 0.03)');
    holographicGradient.addColorStop(0.25, 'rgba(0, 255, 255, 0.03)');
    holographicGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.03)');
    holographicGradient.addColorStop(0.75, 'rgba(255, 0, 150, 0.03)');
    holographicGradient.addColorStop(1, 'rgba(0, 255, 255, 0.03)');
    ctx.fillStyle = holographicGradient;
    ctx.fillRect(0, 0, width, height);
  };

  // Create scratch debris particles - more visible
  const createScratchParticles = (x, y) => {
    for (let i = 0; i < 3; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1, // Slight upward bias
        life: 1.0,
        decay: 0.03 + Math.random() * 0.02,
        size: Math.random() * 2.5 + 1.5,
        color: `rgba(${Math.floor(160 + Math.random() * 50)}, ${Math.floor(160 + Math.random() * 50)}, ${Math.floor(160 + Math.random() * 50)}, 0.9)`
      });
    }
  };

  // Update particles (called separately, not during scratch drawing)
  const updateParticles = () => {
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      particle.vy += 0.1; // Gravity
      return particle.life > 0;
    });
  };

  // Helper function to draw scratch - fixed to ensure proper drawing
  const drawScratch = (point, lastPoint) => {
    if (isRevealed || isRevealing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure canvas is properly initialized before drawing
    if (canvas.width === 0 || canvas.height === 0) {
      const gradientContainer = containerRef.current || canvas.closest('.trendy-gradient-bg') || canvas.parentElement;
      
      if (!gradientContainer) {
        return;
      }
      
      const containerRect = gradientContainer.getBoundingClientRect();
      
      if (containerRect.width > 0 && containerRect.height > 0) {
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(containerRect.width);
        const displayHeight = Math.floor(containerRect.height);
        
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.scale(dpr, dpr);
          createMetallicTexture(ctx, displayWidth, displayHeight);
        }
      } else {
        return;
      }
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // CRITICAL: Save context state and ensure proper setup
    ctx.save();
    
    // Ensure we're using the correct composite operation for erasing
    // 'destination-out' removes pixels where we draw, making them transparent
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 50; // Moderate brush size for realistic scratching
    ctx.globalAlpha = 1.0; // Ensure full opacity for erasing
    ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // Any color works with destination-out
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; // Any color works with destination-out

    // Use display coordinates since context is already scaled
    const x = Math.max(0, Math.min(point.displayX, canvas.width / (window.devicePixelRatio || 1)));
    const y = Math.max(0, Math.min(point.displayY, canvas.height / (window.devicePixelRatio || 1)));

    if (lastPoint && lastPoint.displayX !== null && lastPoint.displayY !== null) {
      // Clamp last point coordinates
      const lastX = Math.max(0, Math.min(lastPoint.displayX, canvas.width / (window.devicePixelRatio || 1)));
      const lastY = Math.max(0, Math.min(lastPoint.displayY, canvas.height / (window.devicePixelRatio || 1)));
      
      // Calculate distance to determine line width for smoother transitions
      const dx = x - lastX;
      const dy = y - lastY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Draw smooth line between points
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Add extra circles for gaps in fast movements
      if (distance > 8) {
        const steps = Math.ceil(distance / 4);
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          const interX = lastX + dx * t;
          const interY = lastY + dy * t;
          ctx.beginPath();
          ctx.arc(interX, interY, 25, 0, Math.PI * 2);
          ctx.fill();
          
          // Add particles at intervals for visual feedback
          if (i % 4 === 0 && particlesRef.current.length < 50) {
            createScratchParticles(interX, interY);
          }
        }
      }
    }

    // Draw circle at current point for better coverage
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // CRITICAL: Restore context state after drawing
    ctx.restore();

    // Create particles at scratch point (limit to prevent performance issues)
    if (particlesRef.current.length < 50) {
      createScratchParticles(x, y);
    }

    if (!hasStartedScratching) {
      setHasStartedScratching(true);
      setIsScratching(true);
      
      // CRITICAL: Completely stop shine animation when scratching starts
      if (shineAnimationRef.current) {
        cancelAnimationFrame(shineAnimationRef.current);
        shineAnimationRef.current = null;
      }
    }

    // Check progress after drawing - use multiple RAF to ensure canvas is fully updated
    // This ensures all drawing operations are complete before calculating progress
    // Only check if reveal is not already in progress
    if (!isRevealingRef.current && !isRevealed) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Double-check before calculating (state might have changed)
            if (isRevealingRef.current || isRevealed) return;
            
            const progress = calculateProgress();
            if (progress !== scratchProgress) {
              setScratchProgress(progress);
              console.log(`[ScratchCard] Progress updated: ${progress}%`);
            }
            // Also trigger the full progress check for reveal logic
            checkProgress();
          });
        });
      });
    }
  };

  // Calculate progress - fixed to accurately detect scratched areas
  const calculateProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      console.log('[ScratchCard] Canvas not ready for progress calculation');
      return 0;
    }

    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.log('[ScratchCard] Context not available for progress calculation');
        return 0;
      }

      // Get image data from entire canvas - use actual canvas dimensions
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Count transparent pixels (alpha channel = 0 means scratched)
      let transparentPixels = 0;
      let totalPixels = 0;
      
      // Check every pixel (not sampling) for accurate progress
      // Alpha channel is at index 3 (R, G, B, A format)
      for (let i = 3; i < pixels.length; i += 4) {
        totalPixels++;
        // Alpha channel = 0 means fully transparent (scratched)
        // Also check if RGB values are 0 (fully erased)
        const alpha = pixels[i];
        const r = pixels[i - 3];
        const g = pixels[i - 2];
        const b = pixels[i - 1];
        
        // Pixel is scratched if alpha is 0 OR if all channels are 0 (fully erased)
        if (alpha === 0 || (r === 0 && g === 0 && b === 0 && alpha === 0)) {
          transparentPixels++;
        }
      }
      
      const progress = totalPixels > 0 ? (transparentPixels / totalPixels) * 100 : 0;
      const roundedProgress = Math.round(progress * 10) / 10;
      
      // Debug logging (remove in production if needed)
      if (roundedProgress > 0) {
        console.log(`[ScratchCard] Progress: ${roundedProgress}% (${transparentPixels}/${totalPixels} pixels)`);
      }
      
      return roundedProgress;
    } catch (error) {
      console.error('[ScratchCard] Error calculating progress:', error);
      return 0;
    }
  };

  // Create confetti particles
  const createConfetti = () => {
    const particles = [];
    const colors = ['#FF6B9D', '#FF8FA3', '#FFB3C1', '#FFD700', '#FFA500', '#FF69B4', '#FF1493'];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 100,
        y: -10,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
    confettiRef.current = particles;
    setShowConfetti(true);
    
    // Clear confetti after animation
    setTimeout(() => {
      setShowConfetti(false);
      confettiRef.current = [];
    }, 2000);
  };

  // Handle reveal
  const handleReveal = async () => {
    // Prevent revealing if already revealed or credited
    if (isRevealingRef.current || isRevealing || isRevealed || scratchCard.status === 'revealed' || scratchCard.status === 'credited') {
      // If already revealed, just show the amount without API call
      if ((scratchCard.status === 'revealed' || scratchCard.status === 'credited') && !isRevealed) {
        setRevealedAmount(scratchCard.amount);
        setIsRevealed(true);
      }
      return;
    }

    // Set flag immediately to prevent multiple calls
    isRevealingRef.current = true;
    setIsRevealing(true);
    
    try {
      const response = await scratchCardApi.revealScratchCard(scratchCard.id);
      if (response.success) {
        setRevealedAmount(response.data.amount);
        setIsRevealed(true);
        createConfetti(); // Trigger confetti animation
        showSuccess('Scratch Card Revealed!', `₹${response.data.amount} unlocked! ${response.data.message}`);
        if (onRevealed) onRevealed(scratchCard.id, response.data.amount);
      }
    } catch (error) {
      // Handle "already revealed" error gracefully
      if (error.message && error.message.includes('already revealed')) {
        // Card was already revealed, just update local state
        console.log('[ScratchCard] Card already revealed, updating local state');
        setRevealedAmount(scratchCard.amount);
        setIsRevealed(true);
        // Don't show error for already revealed cards
      } else {
        showError('Error', error.message || 'Failed to reveal scratch card');
      }
    } finally {
      isRevealingRef.current = false;
      setIsRevealing(false);
      setIsScratching(false);
    }
  };

  // Throttled progress check - fixed to ensure it works properly
  const checkProgress = () => {
    // Don't check progress if already revealed or credited or if reveal is in progress
    if (isRevealingRef.current || isRevealed || scratchCard.status === 'revealed' || scratchCard.status === 'credited') return;
    
    // Clear any existing progress check
    if (progressCheckRef.current) {
      cancelAnimationFrame(progressCheckRef.current);
      progressCheckRef.current = null;
    }
    
    progressCheckRef.current = requestAnimationFrame(() => {
      try {
        // Double-check before calculating progress (state might have changed)
        if (isRevealingRef.current || isRevealed || scratchCard.status === 'revealed' || scratchCard.status === 'credited') {
          progressCheckRef.current = null;
          return;
        }
        
        const progress = calculateProgress();
        setScratchProgress(progress);

        // If 70% scratched, reveal the card (only if not already revealed or in progress)
        if (progress >= 70 && !isRevealingRef.current && !isRevealing && !isRevealed && scratchCard.status !== 'revealed' && scratchCard.status !== 'credited') {
          handleReveal();
        }
      } catch (error) {
        console.warn('[ScratchCard] Error checking progress:', error);
      } finally {
        progressCheckRef.current = null;
      }
    });
  };

  // Use useLayoutEffect for immediate initialization after layout
  useLayoutEffect(() => {
    if (!canvasRef.current || isRevealed) return;
    
    const canvas = canvasRef.current;
    const gradientContainer = containerRef.current || canvas.closest('.trendy-gradient-bg');
    
    if (gradientContainer) {
      const containerRect = gradientContainer.getBoundingClientRect();
      if (containerRect.width > 10 && containerRect.height > 10) {
        // Quick initialization in layout phase
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.floor(containerRect.width);
        const displayHeight = Math.floor(containerRect.height);
        
        if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;
          canvas.style.position = 'absolute';
          canvas.style.top = '0px';
          canvas.style.left = '0px';
          canvas.style.right = '0px';
          canvas.style.bottom = '0px';
          canvas.style.margin = '0';
          canvas.style.padding = '0';
          canvas.style.border = 'none';
          canvas.style.boxSizing = 'border-box';
          canvas.style.display = 'block';
          
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.scale(dpr, dpr);
            createMetallicTexture(ctx, displayWidth, displayHeight);
          }
        }
      }
    }
  }, [isRevealed]);

  // Initialize canvas for scratch effect (full initialization with animations)
  useEffect(() => {
    if (!canvasRef.current || isRevealed) return;

    const canvas = canvasRef.current;

    const initCanvas = () => {
      if (!canvas) return;

      // Get the gradient container (the one with rounded-2xl) - this is our reference
      const gradientContainer = containerRef.current || canvas.closest('.trendy-gradient-bg') || canvas.parentElement;
      
      if (!gradientContainer) {
        // Retry if container not found
        setTimeout(initCanvas, 50);
        return;
      }

      const containerRect = gradientContainer.getBoundingClientRect();
      
      // Check if container has valid dimensions - must be at least 10px to be valid
      if (containerRect.width < 10 || containerRect.height < 10) {
        // Retry after a short delay if dimensions aren't ready
        setTimeout(initCanvas, 50);
        return;
      }
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setTimeout(initCanvas, 50);
        return;
      }
      
      const dpr = window.devicePixelRatio || 1;
      
      // Use EXACT container dimensions - no padding, no margins, just the container size
      const displayWidth = Math.floor(containerRect.width);
      const displayHeight = Math.floor(containerRect.height);
      
      // Check if canvas already has correct dimensions to avoid unnecessary reinitialization
      const currentCanvasWidth = Math.floor(parseFloat(canvas.style.width) || 0);
      const currentCanvasHeight = Math.floor(parseFloat(canvas.style.height) || 0);
      
      // Only reinitialize if dimensions don't match
      if (currentCanvasWidth === displayWidth && currentCanvasHeight === displayHeight && canvas.width > 0 && canvas.height > 0) {
        return; // Already correctly sized
      }
      
      // Set canvas internal dimensions (for drawing) - use exact pixel values
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      
      // Set canvas CSS dimensions (for display) - must match container exactly
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;
      canvas.style.position = 'absolute';
      canvas.style.top = '0px';
      canvas.style.left = '0px';
      canvas.style.right = '0px';
      canvas.style.bottom = '0px';
      canvas.style.margin = '0';
      canvas.style.padding = '0';
      canvas.style.border = 'none';
      canvas.style.boxSizing = 'border-box';
      canvas.style.display = 'block';
      
      // Scale context for high DPI displays
      ctx.scale(dpr, dpr);

      // Create metallic silver texture - fills entire canvas area
      createMetallicTexture(ctx, displayWidth, displayHeight);

      // Start shine animation
      startShineAnimation(ctx, displayWidth, displayHeight);
    };

    // Different shine animation - gentle radial pulse effect
    // CRITICAL FIX: Pause shine animation while user is scratching to prevent interference
    const startShineAnimation = (ctx, width, height) => {
      let pulsePhase = 0; // Phase for pulse animation (0 to 2π)
      const pulseSpeed = 0.002; // Very slow pulse speed
      let lastRedrawTime = 0;
      const redrawInterval = 5000; // Only redraw texture every 5 seconds to reduce interference
      
      const animateShine = () => {
        if (isRevealed || isRevealing || !canvasRef.current) {
          if (shineAnimationRef.current) {
            cancelAnimationFrame(shineAnimationRef.current);
            shineAnimationRef.current = null;
          }
          return;
        }

        // CRITICAL: Pause shine animation while user is actively scratching
        // Also pause for a longer period after scratching ends to ensure progress calculation completes
        if (isDrawingRef.current || isScratching) {
          // Don't resume until scratching has completely stopped
          shineAnimationRef.current = requestAnimationFrame(() => {
            // Check again after a delay to ensure scratching has stopped
            setTimeout(() => {
              if (!isDrawingRef.current && !isScratching && !isRevealed && !isRevealing && canvasRef.current) {
                shineAnimationRef.current = requestAnimationFrame(animateShine);
              }
            }, 200);
          });
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          shineAnimationRef.current = requestAnimationFrame(animateShine);
          return;
        }

        // Get fresh context to avoid stale context issues
        const currentCtx = canvas.getContext('2d', { willReadFrequently: true });
        if (!currentCtx) {
          shineAnimationRef.current = requestAnimationFrame(animateShine);
          return;
        }

        // Get actual canvas dimensions (accounting for DPR)
        const dpr = window.devicePixelRatio || 1;
        const actualWidth = canvas.width / dpr;
        const actualHeight = canvas.height / dpr;

        const currentTime = Date.now();
        const needsTextureRedraw = (currentTime - lastRedrawTime) >= redrawInterval;

        // Save current scratch state before redrawing - use actual canvas dimensions
        // CRITICAL: Only redraw if user is NOT currently scratching
        if (isDrawingRef.current || isScratching) {
          shineAnimationRef.current = requestAnimationFrame(animateShine);
          return; // Skip this frame entirely if user is scratching
        }
        
        const currentImageData = currentCtx.getImageData(0, 0, canvas.width, canvas.height);
        const scratchMask = new Uint8Array(currentImageData.data.length);
        for (let i = 3; i < currentImageData.data.length; i += 4) {
          // Mark as scratched if alpha is 0 or all channels are 0
          const alpha = currentImageData.data[i];
          const r = currentImageData.data[i - 3];
          const g = currentImageData.data[i - 2];
          const b = currentImageData.data[i - 1];
          scratchMask[i] = (alpha === 0 || (r === 0 && g === 0 && b === 0)) ? 1 : 0; // 1 = scratched
        }

        // Only redraw texture periodically to reduce animation intensity
        if (needsTextureRedraw) {
          // Redraw metallic texture only on non-scratched areas - full coverage
          createMetallicTexture(currentCtx, actualWidth, actualHeight);

          // Apply scratch mask back - use actual canvas dimensions
          // CRITICAL: Ensure scratched areas remain transparent
          const newImageData = currentCtx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 3; i < newImageData.data.length; i += 4) {
            if (scratchMask[i] === 1) {
              // Keep scratched areas fully transparent (all channels = 0)
              newImageData.data[i] = 0; // Alpha = 0 (fully transparent)
              newImageData.data[i - 1] = 0; // Blue = 0
              newImageData.data[i - 2] = 0; // Green = 0
              newImageData.data[i - 3] = 0; // Red = 0
            }
          }
          currentCtx.putImageData(newImageData, 0, 0);
          lastRedrawTime = currentTime;
        }

        // Draw gentle radial pulse shine effect (only on non-scratched areas)
        currentCtx.save();
        currentCtx.globalCompositeOperation = 'source-over';
        
        // Calculate pulse intensity (0.02 to 0.05 range for subtlety)
        const pulseIntensity = 0.02 + (Math.sin(pulsePhase) * 0.015);
        
        // Create radial gradient from center with pulsing intensity - use actual dimensions
        const centerX = actualWidth * 0.5;
        const centerY = actualHeight * 0.5;
        const maxRadius = Math.max(actualWidth, actualHeight) * 0.8;
        
        const radialShine = currentCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        radialShine.addColorStop(0, `rgba(255, 255, 255, ${pulseIntensity})`);
        radialShine.addColorStop(0.4, `rgba(255, 255, 255, ${pulseIntensity * 0.6})`);
        radialShine.addColorStop(0.7, `rgba(255, 255, 255, ${pulseIntensity * 0.3})`);
        radialShine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        currentCtx.fillStyle = radialShine;
        currentCtx.fillRect(0, 0, actualWidth, actualHeight);
        currentCtx.restore();

        // Restore scratch mask after shine - use actual canvas dimensions
        // CRITICAL: Ensure scratched areas remain transparent after shine effect
        const afterShineData = currentCtx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 3; i < afterShineData.data.length; i += 4) {
          if (scratchMask[i] === 1) {
            // Keep scratched areas fully transparent
            afterShineData.data[i] = 0; // Alpha = 0
            afterShineData.data[i - 1] = 0; // Blue = 0
            afterShineData.data[i - 2] = 0; // Green = 0
            afterShineData.data[i - 3] = 0; // Red = 0
          }
        }
        currentCtx.putImageData(afterShineData, 0, 0);

        // Update and draw particles on separate canvas
        if (textureCanvasRef.current && particlesRef.current.length > 0) {
          const particleCanvas = textureCanvasRef.current;
          const gradientContainer = containerRef.current || particleCanvas.closest('.trendy-gradient-bg') || particleCanvas.parentElement;
          
          if (gradientContainer) {
            const containerRect = gradientContainer.getBoundingClientRect();
            const particleCtx = particleCanvas.getContext('2d', { willReadFrequently: true });
            const dpr = window.devicePixelRatio || 1;
            
            if (particleCanvas.width !== containerRect.width * dpr || particleCanvas.height !== containerRect.height * dpr) {
              particleCanvas.width = containerRect.width * dpr;
              particleCanvas.height = containerRect.height * dpr;
              particleCanvas.style.width = `${containerRect.width}px`;
              particleCanvas.style.height = `${containerRect.height}px`;
              particleCtx.scale(dpr, dpr);
            }
            
            // Clear with slight fade for trail effect
            particleCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            particleCtx.fillRect(0, 0, containerRect.width, containerRect.height);
            
            // Update particles first
            updateParticles();
            
            // Then draw them
            particlesRef.current.forEach(particle => {
              const alpha = Math.min(1, particle.life);
              const rgbMatch = particle.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
              if (rgbMatch) {
                particleCtx.fillStyle = `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
                particleCtx.beginPath();
                particleCtx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
                particleCtx.fill();
              }
            });
          }
        }

        // Update pulse phase
        pulsePhase += pulseSpeed;
        if (pulsePhase >= Math.PI * 2) {
          pulsePhase = 0;
        }

        shineAnimationRef.current = requestAnimationFrame(animateShine);
      };

      // Start animation
      shineAnimationRef.current = requestAnimationFrame(animateShine);
    };

    // Initialize canvas - use multiple strategies to ensure it happens after render
    const initCanvasWithRetry = (attempt = 0, maxAttempts = 10) => {
      if (attempt >= maxAttempts) {
        console.warn('[ScratchCard] Max initialization attempts reached');
        return;
      }

      // Try immediate initialization
      requestAnimationFrame(() => {
        const gradientContainer = containerRef.current || canvas.closest('.trendy-gradient-bg');
        if (!gradientContainer) {
          setTimeout(() => initCanvasWithRetry(attempt + 1, maxAttempts), 50);
          return;
        }

        const containerRect = gradientContainer.getBoundingClientRect();
        
        // Check if container has valid dimensions
        if (containerRect.width < 10 || containerRect.height < 10) {
          setTimeout(() => initCanvasWithRetry(attempt + 1, maxAttempts), 50);
          return;
        }

        // Initialize canvas
        initCanvas();
        
        // Verify initialization was successful
        setTimeout(() => {
          const canvasWidth = parseFloat(canvas.style.width) || 0;
          const canvasHeight = parseFloat(canvas.style.height) || 0;
          const currentRect = gradientContainer.getBoundingClientRect();
          
          // Check if canvas dimensions match container (with 2px tolerance for rounding)
          if (Math.abs(canvasWidth - currentRect.width) > 2 || 
              Math.abs(canvasHeight - currentRect.height) > 2 ||
              canvas.width === 0 || canvas.height === 0) {
            // Retry if dimensions don't match
            if (attempt < maxAttempts - 1) {
              initCanvasWithRetry(attempt + 1, maxAttempts);
            }
          }
        }, 100);

        // Additional check after animations/layout shifts complete
        setTimeout(() => {
          const finalRect = gradientContainer.getBoundingClientRect();
          const finalCanvasWidth = parseFloat(canvas.style.width) || 0;
          const finalCanvasHeight = parseFloat(canvas.style.height) || 0;
          
          if (Math.abs(finalCanvasWidth - finalRect.width) > 2 || 
              Math.abs(finalCanvasHeight - finalRect.height) > 2) {
            initCanvas();
          }
        }, 300);
      });
    };
    
    // Start initialization with multiple strategies
    // Strategy 1: Immediate attempt
    const initTimeout1 = setTimeout(() => initCanvasWithRetry(0, 10), 10);
    
    // Strategy 2: After DOM is fully ready
    const initTimeout2 = setTimeout(() => {
      if (canvas.width === 0 || canvas.height === 0) {
        initCanvasWithRetry(0, 5);
      }
    }, 100);
    
    // Strategy 3: After potential animations complete
    const initTimeout3 = setTimeout(() => {
      if (canvas.width === 0 || canvas.height === 0) {
        initCanvasWithRetry(0, 5);
      }
    }, 500);
    
    // Add touch event listeners with passive: false to allow preventDefault
    // These need to be defined here to access the latest handlers
    const touchStartHandler = (e) => {
      if (isRevealed || isRevealing) return;
      e.preventDefault();
      e.stopPropagation();
      
      // Haptic feedback removed to avoid browser warnings
      // Browsers block navigator.vibrate unless called in very specific user gesture contexts
      
      const point = getPointFromEvent(e);
      if (!point) return;

      isDrawingRef.current = true;
      lastPointRef.current = { 
        x: point.x, 
        y: point.y,
        displayX: point.displayX,
        displayY: point.displayY
      };
      drawScratch(point, null);
    };

    const touchMoveHandler = (e) => {
      if (!isDrawingRef.current || isRevealed || isRevealing) return;
      e.preventDefault();
      e.stopPropagation();

      const point = getPointFromEvent(e);
      if (!point) return;

      // Only draw if there's actual movement (prevents auto-reveal on touch)
      if (lastPointRef.current && lastPointRef.current.displayX !== null) {
      drawScratch(point, lastPointRef.current);
      } else {
        // First movement - initialize
        lastPointRef.current = { 
          x: point.x, 
          y: point.y,
          displayX: point.displayX,
          displayY: point.displayY
        };
        drawScratch(point, null);
      }
      
      lastPointRef.current = { 
        x: point.x, 
        y: point.y,
        displayX: point.displayX,
        displayY: point.displayY
      };
    };

    const touchEndHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDrawingRef.current = false;
      lastPointRef.current = { x: null, y: null, displayX: null, displayY: null };
    };

    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });
    canvas.addEventListener('touchcancel', touchEndHandler, { passive: false });
    
    // Re-initialize on window resize
    const handleResize = () => {
      if (!isRevealed) {
        initCanvas();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver to ensure canvas stays in sync with container
    let resizeObserver = null;
    const gradientContainer = containerRef.current || canvas.closest('.trendy-gradient-bg') || canvas.parentElement;
    
    if (window.ResizeObserver && gradientContainer) {
      resizeObserver = new ResizeObserver((entries) => {
        if (!isRevealed && entries.length > 0) {
          const entry = entries[0];
          // Only reinitialize if dimensions are valid and have changed
          if (entry.contentRect.width > 10 && entry.contentRect.height > 10) {
            requestAnimationFrame(() => {
              const currentWidth = parseFloat(canvas.style.width) || 0;
              const currentHeight = parseFloat(canvas.style.height) || 0;
              
              // Reinitialize if dimensions don't match (with 1px tolerance)
              if (Math.abs(currentWidth - entry.contentRect.width) > 1 || 
                  Math.abs(currentHeight - entry.contentRect.height) > 1) {
                initCanvas();
              }
            });
          }
        }
      });
      resizeObserver.observe(gradientContainer);
    }
    
    // Use IntersectionObserver to detect when container becomes visible
    let intersectionObserver = null;
    if (window.IntersectionObserver && gradientContainer) {
      intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && (canvas.width === 0 || canvas.height === 0)) {
            // Container is visible but canvas not initialized - initialize now
            setTimeout(() => initCanvas(), 50);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px'
      });
      intersectionObserver.observe(gradientContainer);
    }
    
    return () => {
      clearTimeout(initTimeout1);
      clearTimeout(initTimeout2);
      clearTimeout(initTimeout3);
      canvas.removeEventListener('touchstart', touchStartHandler);
      canvas.removeEventListener('touchmove', touchMoveHandler);
      canvas.removeEventListener('touchend', touchEndHandler);
      canvas.removeEventListener('touchcancel', touchEndHandler);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      if (shineAnimationRef.current) {
        cancelAnimationFrame(shineAnimationRef.current);
        shineAnimationRef.current = null;
      }
      particlesRef.current = [];
    };
  }, [isRevealed, isRevealing]);

  const handleScratchStart = (e) => {
    if (isRevealed || isRevealing) return;
    e.preventDefault();
    e.stopPropagation();
    
    // Haptic feedback removed to avoid browser warnings
    // Browsers block navigator.vibrate unless called in very specific user gesture contexts
    
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      // Canvas not ready, try to initialize
      const gradientContainer = containerRef.current || canvas?.closest('.trendy-gradient-bg');
      if (gradientContainer) {
        const containerRect = gradientContainer.getBoundingClientRect();
        if (containerRect.width > 0 && containerRect.height > 0) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = containerRect.width * dpr;
          canvas.height = containerRect.height * dpr;
          canvas.style.width = `${containerRect.width}px`;
          canvas.style.height = `${containerRect.height}px`;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.scale(dpr, dpr);
            createMetallicTexture(ctx, containerRect.width, containerRect.height);
          }
        }
      }
      return;
    }
    
    const point = getPointFromEvent(e);
    if (!point) return;

    isDrawingRef.current = true;
    lastPointRef.current = { 
      x: point.x, 
      y: point.y,
      displayX: point.displayX,
      displayY: point.displayY
    };
    // Draw immediately on touch start for better responsiveness
    drawScratch(point, null);
  };

  const handleScratchMove = (e) => {
    if (!isDrawingRef.current || isRevealed || isRevealing) return;
    e.preventDefault();
    e.stopPropagation();

    const point = getPointFromEvent(e);
    if (!point) return;

    // Only draw if there's actual movement (prevents auto-reveal on click)
    if (lastPointRef.current && lastPointRef.current.displayX !== null) {
    drawScratch(point, lastPointRef.current);
    } else {
      // First movement - initialize
      lastPointRef.current = { 
        x: point.x, 
        y: point.y,
        displayX: point.displayX,
        displayY: point.displayY
      };
      drawScratch(point, null);
    }
    
    lastPointRef.current = { 
      x: point.x, 
      y: point.y,
      displayX: point.displayX,
      displayY: point.displayY
    };
  };

  const handleScratchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDrawingRef.current = false;
    setIsScratching(false);
    lastPointRef.current = { x: null, y: null, displayX: null, displayY: null };
    
    // Check progress one final time when scratching ends
    // Use multiple delays to ensure canvas is fully updated
    // Only check if reveal is not already in progress
    if (hasStartedScratching && !isRevealingRef.current && !isRevealed) {
      // First check after a short delay
      setTimeout(() => {
        // Double-check before calculating (state might have changed)
        if (isRevealingRef.current || isRevealed) return;
        
        const progress = calculateProgress();
        setScratchProgress(progress);
        checkProgress();
        
        // Second check after longer delay to catch any late updates
        setTimeout(() => {
          // Double-check again before calculating
          if (isRevealingRef.current || isRevealed) return;
          
          const finalProgress = calculateProgress();
          if (finalProgress !== progress) {
            setScratchProgress(finalProgress);
            checkProgress();
          }
        }, 300);
      }, 150);
    }
  };

  const handleCredit = async () => {
    try {
      const response = await scratchCardApi.creditScratchCard(scratchCard.id);
      if (response.success) {
        showSuccess('Cashback Credited!', `₹${response.data.amount} has been added to your wallet.`);
        await fetchBalance();
        if (onCredited) onCredited(scratchCard.id);
      }
    } catch (error) {
      showError('Error', error.message || 'Failed to credit scratch card');
    }
  };

  // Format date for display: "08 Nov 2025, 10:45 PM"
  const formatCreditedDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      // Format in IST
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  const getStatusBadge = () => {
    switch (scratchCard.status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Gift className="w-3 h-3" />
            Ready to Scratch
          </span>
        );
      case 'revealed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <Sparkles className="w-3 h-3" />
            Revealed
          </span>
        );
      case 'credited':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            Credited
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-lg h-full flex flex-col overflow-hidden">

      {/* Scratch Card Area - Trendy Modern Design */}
      <div className="relative mb-3 flex-1">
        <div 
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden h-full flex items-center justify-center min-h-[140px] sm:min-h-[180px] trendy-gradient-bg"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
            backgroundSize: '400% 400%',
            position: 'relative',
            width: '100%',
            height: '100%'
          }}>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .trendy-gradient-bg {
              animation: gradientShift 8s ease infinite;
            }
          `}} />
          
          {/* Trendy pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }} />
          
          {/* Amount Display (behind scratch layer) */}
          <div className="text-center relative z-0 w-full px-4 sm:px-6 py-4 sm:py-6">
            {isRevealed ? (
              <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="relative"
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{
                      x: ['-100%', '200%'],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                    style={{ width: '60%', height: '100%' }}
                  />
                </div>
                {/* Trendy amount display with glow effect */}
                <div className="relative">
                  <div className="text-4xl sm:text-5xl font-black mb-2" style={{
                    background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 50%, #fff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    textShadow: '0 0 30px rgba(255,255,255,0.5)',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}>
                    ₹{Math.round(revealedAmount || scratchCard.amount)}
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white/90 drop-shadow-lg">Cashback Unlocked! 🎉</p>
                </div>
              </motion.div>
            ) : (
              <div className="text-4xl sm:text-5xl font-black text-white/20 drop-shadow-lg">
                ₹?
              </div>
            )}
          </div>

          {/* Confetti Effect */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-xl">
              {confettiRef.current.map((particle, index) => (
                <motion.div
                  key={index}
                  className="absolute"
                  initial={{
                    x: `${particle.x}%`,
                    y: `${particle.y}%`,
                    rotate: particle.rotation,
                    scale: 0
                  }}
                  animate={{
                    y: `${particle.y + 120}%`,
                    x: `${particle.x + particle.vx * 10}%`,
                    rotate: particle.rotation + particle.rotationSpeed * 20,
                    scale: [0, 1, 1, 0],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    ease: 'easeOut'
                  }}
                  style={{
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    backgroundColor: particle.color,
                    borderRadius: '50%',
                    boxShadow: `0 0 ${particle.size}px ${particle.color}`
                  }}
                />
              ))}
            </div>
          )}

          {/* Trendy Scratch Canvas Overlay - Full coverage, no gaps */}
          {!isRevealed && (
            <>
              {/* Particle Layer for scratch debris */}
              <canvas
                ref={textureCanvasRef}
                className="absolute pointer-events-none"
                style={{ 
                  zIndex: 9,
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: 0,
                  border: 'none',
                  position: 'absolute'
                }}
              />
              {/* Main Scratch Canvas - Full coverage, edge to edge */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleScratchStart}
              onMouseMove={handleScratchMove}
              onMouseUp={handleScratchEnd}
              onMouseLeave={handleScratchEnd}
              className="absolute cursor-crosshair touch-none select-none"
              style={{ 
                zIndex: 30, 
                userSelect: 'none', 
                WebkitUserSelect: 'none', 
                touchAction: 'none',
                top: '0px',
                left: '0px',
                right: '0px',
                bottom: '0px',
                width: '100%',
                height: '100%',
                margin: '0',
                padding: '0',
                border: 'none',
                outline: 'none',
                pointerEvents: 'auto',
                position: 'absolute',
                boxSizing: 'border-box',
                backgroundColor: 'transparent'
              }}
            />
            </>
          )}

          {/* Trendy Scratch Progress Indicator */}
          {!isRevealed && hasStartedScratching && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                {Math.round(scratchProgress)}% scratched
              </div>
            </div>
          )}
          
          {/* Trendy corner accents - behind canvas */}
          {!isRevealed && (
            <>
              <div className="absolute top-2 left-2 w-6 h-6 border-2 border-white/30 rounded-tl-2xl border-r-0 border-b-0 z-5 pointer-events-none" />
              <div className="absolute top-2 right-2 w-6 h-6 border-2 border-white/30 rounded-tr-2xl border-l-0 border-b-0 z-5 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-2 border-white/30 rounded-bl-2xl border-r-0 border-t-0 z-5 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-2 border-white/30 rounded-br-2xl border-l-0 border-t-0 z-5 pointer-events-none" />
            </>
          )}
        </div>
      </div>

      {/* Trendy Action Buttons */}
      <div className="space-y-2 mt-auto">
        {scratchCard.status === 'pending' && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-300/50 dark:border-blue-700/50 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                Scratch to reveal! Auto-credited after delivery.
              </p>
            </div>
          </div>
        )}

        {scratchCard.status === 'revealed' && (
          showAutoCreditMessage ? (
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-300/50 dark:border-emerald-700/50 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                ✨ Auto-credited after delivery
              </p>
            </div>
          ) : (
            <button
              onClick={handleCredit}
              className="w-full bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 text-white py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl text-sm sm:text-base font-bold hover:from-pink-700 hover:via-rose-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundSize: '200% 200%',
                animation: 'gradientShift 3s ease infinite'
              }}
            >
              💰 Credit to Wallet
            </button>
          )
        )}

        {scratchCard.status === 'credited' && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-300/50 dark:border-emerald-700/50 rounded-xl px-4 py-2.5 backdrop-blur-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                ₹{Math.round(scratchCard.amount)} credited
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Credited Date Footer */}
      {scratchCard.status === 'credited' && scratchCard.creditedAt && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
            Credited on: {formatCreditedDate(scratchCard.creditedAt)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScratchCard;

