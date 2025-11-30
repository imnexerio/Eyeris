// Downloads page loader - fetches latest releases from GitHub
// Used by the SPA to load download links dynamically

(function() {
  'use strict';

  const GITHUB_REPO = 'imnexerio/Eyeris';
  let isLoaded = false;
  
  // Platform detection patterns
  const platforms = {
    windows: {
      icon: '🖥️',
      name: 'Windows',
      patterns: [
        { regex: /Eyeris.*x64.*setup\.exe$/i, name: 'Windows Installer', desc: 'Recommended', priority: 1 },
        { regex: /Eyeris.*x64.*\.msi$/i, name: 'Windows MSI', desc: 'For IT deployment', priority: 2 },
        { regex: /Eyeris.*Portable.*\.exe$/i, name: 'Portable', desc: 'No installation needed', priority: 3 }
      ]
    },
    macos: {
      icon: '🍎',
      name: 'macOS',
      patterns: [
        { regex: /Eyeris.*aarch64\.dmg$/i, name: 'Apple Silicon', desc: 'For M1/M2/M3/M4 Macs', priority: 1 },
        { regex: /Eyeris.*x64\.dmg$/i, name: 'Intel', desc: 'For Intel Macs', priority: 2 },
        { regex: /Eyeris.*aarch64.*\.app\.tar\.gz$/i, name: 'Apple Silicon (tar.gz)', desc: 'Portable', priority: 3 },
        { regex: /Eyeris.*x64.*\.app\.tar\.gz$/i, name: 'Intel (tar.gz)', desc: 'Portable', priority: 4 }
      ]
    },
    linux: {
      icon: '🐧',
      name: 'Linux',
      patterns: [
        { regex: /eyeris.*amd64\.deb$/i, name: 'Debian/Ubuntu', desc: '.deb package', priority: 1 },
        { regex: /eyeris.*x86_64\.rpm$/i, name: 'Fedora/RHEL', desc: '.rpm package', priority: 2 },
        { regex: /eyeris.*\.AppImage$/i, name: 'AppImage', desc: 'Universal Linux', priority: 3 }
      ]
    },
    android: {
      icon: '📱',
      name: 'Android',
      patterns: [
        { regex: /Eyeris\.apk$/i, name: 'Android APK', desc: 'Direct install', priority: 1 }
      ]
    }
  };

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  async function fetchLatestRelease() {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    if (!response.ok) throw new Error('Failed to fetch release info');
    return response.json();
  }

  function categorizeAssets(assets) {
    const categorized = {};
    
    for (const [platformKey, platform] of Object.entries(platforms)) {
      categorized[platformKey] = {
        ...platform,
        assets: []
      };
      
      for (const pattern of platform.patterns) {
        const matchingAsset = assets.find(asset => pattern.regex.test(asset.name));
        if (matchingAsset) {
          categorized[platformKey].assets.push({
            ...matchingAsset,
            displayName: pattern.name,
            description: pattern.desc,
            priority: pattern.priority
          });
        }
      }
      
      // Sort by priority
      categorized[platformKey].assets.sort((a, b) => a.priority - b.priority);
    }
    
    return categorized;
  }

  function renderDownloads(release, categorized) {
    const container = document.getElementById('downloadContent');
    if (!container) return;
    
    let html = '<div class="download-grid">';
    
    for (const [platformKey, platform] of Object.entries(categorized)) {
      if (platform.assets.length === 0) continue;
      
      html += `
        <div class="download-card">
          <h3><span class="platform-icon">${platform.icon}</span> ${platform.name}</h3>
          <ul class="download-links">
      `;
      
      for (const asset of platform.assets) {
        html += `
          <li>
            <a href="${asset.browser_download_url}" download>
              <span class="file-info">
                <span class="file-name">${asset.displayName}</span>
                <span class="file-desc">${asset.description}</span>
              </span>
              <span class="file-size">${formatBytes(asset.size)}</span>
            </a>
          </li>
        `;
      }
      
      html += '</ul></div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
  }

  function updateVersionBadge(release) {
    const badge = document.getElementById('versionBadge');
    if (!badge) return;
    badge.classList.remove('loading');
    badge.innerHTML = `
      <span>✨</span>
      <span><strong>${release.tag_name}</strong> — Released ${formatDate(release.published_at)}</span>
    `;
  }

  function showError(message, isNoRelease = false) {
    const container = document.getElementById('downloadContent');
    if (!container) return;
    
    if (isNoRelease) {
      container.innerHTML = `
        <div class="download-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <h3 style="margin-bottom: 1rem;">🚧 No Releases Available Yet</h3>
          <p style="color: #a1a1aa; margin-bottom: 1.5rem;">
            Desktop builds are coming soon! In the meantime, you can:
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center;">
            <a href="#dashboard" data-page="dashboard" class="nav-link web-btn" style="display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-radius: 8px; color: white; text-decoration: none;">
              Use Web App →
            </a>
            <a href="https://github.com/${GITHUB_REPO}#-getting-started" target="_blank" style="display: inline-block; padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #e4e4e7; text-decoration: none;">
              Build from Source →
            </a>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="error-msg">
          <strong>Unable to load downloads:</strong> ${message}<br>
          <a href="https://github.com/${GITHUB_REPO}/releases" target="_blank">View releases on GitHub →</a>
        </div>
      `;
    }
    
    const badge = document.getElementById('versionBadge');
    if (badge) {
      badge.classList.remove('loading');
      badge.innerHTML = isNoRelease 
        ? '<span>🚧</span><span>No releases yet — Use Web App or build from source</span>'
        : '<span>⚠️</span><span>Could not fetch version info</span>';
    }
  }

  function showNoAssets() {
    const container = document.getElementById('downloadContent');
    if (!container) return;
    container.innerHTML = `
      <div class="download-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <h3 style="margin-bottom: 1rem;">📦 Release Found, But No Downloads</h3>
        <p style="color: #a1a1aa; margin-bottom: 1rem;">
          The latest release doesn't have any downloadable files attached yet.
        </p>
        <a href="https://github.com/${GITHUB_REPO}/releases" target="_blank" style="color: #8b5cf6;">
          Check GitHub Releases →
        </a>
      </div>
    `;
  }

  // Main load function
  async function loadDownloads() {
    // Only load once
    if (isLoaded) return;
    
    // Check if elements exist
    const container = document.getElementById('downloadContent');
    const badge = document.getElementById('versionBadge');
    if (!container || !badge) return;
    
    try {
      const release = await fetchLatestRelease();
      const categorized = categorizeAssets(release.assets);
      
      // Check if any platform has assets
      const hasAnyAssets = Object.values(categorized).some(p => p.assets.length > 0);
      
      updateVersionBadge(release);
      
      if (hasAnyAssets) {
        renderDownloads(release, categorized);
      } else {
        showNoAssets();
      }
      
      isLoaded = true;
    } catch (error) {
      console.error('Error fetching release:', error);
      // Check if it's a 404 (no releases)
      const isNoRelease = error.message.includes('404') || error.message.includes('Not Found');
      showError(error.message, isNoRelease);
    }
  }

  // Expose loadDownloads globally for the SPA router
  window.loadDownloads = loadDownloads;
})();
