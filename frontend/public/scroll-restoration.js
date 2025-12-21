/**
 * Ultra-early scroll restoration script
 * This runs before any other JavaScript to prevent scroll jumping
 */

(function() {
  // Disable browser's automatic scroll restoration immediately
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  
  // Function to restore scroll position
  function restoreScroll() {
    const savedScrollPosition = sessionStorage.getItem('bannerScrollPosition');
    if (savedScrollPosition) {
      const scrollY = parseInt(savedScrollPosition);
      if (scrollY > 0) {
        // Force scroll to position using multiple methods
        window.scrollTo(0, scrollY);
        document.documentElement.scrollTop = scrollY;
        document.body.scrollTop = scrollY;
        sessionStorage.removeItem('bannerScrollPosition');
        console.log('Scroll restored to:', scrollY);
      }
    }
  }
  
  // Restore immediately
  restoreScroll();
  
  // Also try on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreScroll);
  } else {
    restoreScroll();
  }
  
  // Multiple attempts with different timings
  setTimeout(restoreScroll, 0);
  setTimeout(restoreScroll, 1);
  setTimeout(restoreScroll, 5);
  setTimeout(restoreScroll, 10);
  setTimeout(restoreScroll, 20);
  setTimeout(restoreScroll, 50);
  setTimeout(restoreScroll, 100);
  setTimeout(restoreScroll, 200);
  setTimeout(restoreScroll, 500);
  
  // Also try on window load
  window.addEventListener('load', restoreScroll);
  
  // Use requestAnimationFrame for next frame
  requestAnimationFrame(restoreScroll);
  requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
})();
