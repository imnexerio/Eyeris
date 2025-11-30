// Handle external links in Tauri - open in system browser
// This script should be included on all HTML pages

(function() {
  // Detect if running in Tauri (native app)
  const isTauri = window.__TAURI__ !== undefined;
  
  if (!isTauri) return;
  
  console.log('Tauri link handler initialized');
  
  // Intercept all clicks on links
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    
    // Skip if this is an SPA navigation link (has data-page attribute)
    if (link.hasAttribute('data-page')) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Skip hash-only links (SPA navigation)
    if (href.startsWith('#')) return;
    
    // Check if it's an external link (starts with http/https)
    if (href.startsWith('http://') || href.startsWith('https://')) {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        // Dynamic import of Tauri opener plugin
        const { open } = await import('@tauri-apps/plugin-opener');
        await open(href);
        console.log('Opened external link:', href);
      } catch (err) {
        console.error('Failed to open external link:', err);
        // Show user-friendly error
        alert('Could not open link: ' + href + '\n\nPlease copy and paste it into your browser.');
      }
      return false;
    }
  }, true); // Use capture phase to intercept before other handlers
})();
