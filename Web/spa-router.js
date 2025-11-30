// SPA Router - Handles navigation without page reloads
// This keeps eye tracking running while switching between pages

(function() {
  'use strict';

  // Current active page
  let currentPage = 'dashboard';
  
  // Check if webcam is running (will be set by script.js)
  window.isWebcamTracking = false;

  // Initialize router
  function initRouter() {
    
    // Handle navigation clicks
    document.addEventListener('click', handleNavClick);
    
    // Handle browser back/forward
    window.addEventListener('popstate', handlePopState);
    
    // Handle initial page load based on hash
    const hash = window.location.hash.slice(1) || 'dashboard';
    navigateToPage(hash, false);
    
    // Handle "Back to Dashboard" button in mini player
    const backBtn = document.getElementById('backToDashboard');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToPage('dashboard');
      });
    }
  }

  function handleNavClick(e) {
    // Find closest link with data-page attribute
    const link = e.target.closest('[data-page]');
    if (!link) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const page = link.getAttribute('data-page');
    navigateToPage(page);
  }

  function handlePopState(e) {
    const page = e.state?.page || 'dashboard';
    navigateToPage(page, false);
  }

  function navigateToPage(page, pushState = true) {
    if (!page) page = 'dashboard';
    
    // Hide all pages
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(p => p.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      targetPage.classList.add('active');
      currentPage = page;
    } else {
      // Fallback to dashboard
      document.getElementById('page-dashboard')?.classList.add('active');
      currentPage = 'dashboard';
    }
    
    // Update nav active state
    updateNavActiveState(page);
    
    // Show/hide mini player when tracking is active
    updateMiniPlayer();
    
    // Update URL hash
    if (pushState) {
      history.pushState({ page }, '', `#${page}`);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Load downloads if needed
    if (page === 'downloads' && typeof window.loadDownloads === 'function') {
      window.loadDownloads();
    }
  }

  function updateNavActiveState(activePage) {
    // Update all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const page = link.getAttribute('data-page');
      if (page === activePage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function updateMiniPlayer() {
    const miniPlayer = document.getElementById('miniPlayer');
    if (!miniPlayer) return;
    
    // Show mini player only when:
    // 1. Webcam is tracking
    // 2. Not on dashboard page
    if (window.isWebcamTracking && currentPage !== 'dashboard') {
      miniPlayer.style.display = 'block';
    } else {
      miniPlayer.style.display = 'none';
    }
  }

  // Expose functions for script.js to use
  window.spaRouter = {
    navigateToPage,
    updateMiniPlayer,
    getCurrentPage: () => currentPage
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
  } else {
    initRouter();
  }
})();
