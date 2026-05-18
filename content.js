window.__chromeGoodsDownloadLoaded = true;
console.log('[content] chrome-goods-download content script loaded');

// Message types
const MESSAGE_TYPES = {
  GET_PAGE_DATA: 'getPageData',
  PAGE_DATA: 'pageData',
  READY: 'ready'
};

// Platform detection
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('tmall')) return 'tmall';
  if (hostname.includes('taobao')) return 'taobao';
  return null;
}

function isDetailPage(platform) {
  const url = window.location.href;
  const pathname = window.location.pathname;

  if (platform === 'tmall') {
    return pathname.includes('item.htm') ||
           window.location.hostname === 'detail.tmall.com';
  }
  if (platform === 'taobao') {
    return url.includes('item.htm?id=') ||
           url.includes('/i/') ||
           pathname.includes('detail.htm');
  }
  return false;
}

function sendUnsupportedMessage(reason) {
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.PAGE_DATA,
    data: {
      error: true,
      errorType: 'unsupportedPage',
      message: reason,
      url: window.location.href
    }
  });
}

/**
 * Normalize image URL: add https: prefix if protocol-less
 * @param {string} url
 * @returns {string}
 */
function normalizeImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  return url;
}

/**
 * Check if URL is a valid product image (exclude tracking pixels, icons, placeholders)
 * @param {string} url
 * @returns {boolean}
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  // Exclude tracking pixels and icons
  if (lowerUrl.includes('pixel') || lowerUrl.includes('1.gif') ||
      lowerUrl.includes('data:image') || lowerUrl.includes('blank.gif') ||
      lowerUrl.includes('data:image/svg')) {
    return false;
  }
  // Exclude Alibaba placeholder images
  if (lowerUrl.includes('g.alicdn.com/s.gif') || lowerUrl.includes('amos.aliyun') ||
      lowerUrl.includes('a.aliyun') || lowerUrl.includes('log.aliyun')) {
    return false;
  }
  // Must be http, https, or protocol-less URL (//)
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://') && !lowerUrl.startsWith('//')) {
    return false;
  }
  return true;
}

/**
 * Show notification bar on the page
 * @param {string} message
 * @param {string} type - 'info' | 'success' | 'error'
 */
function showNotification(message, type = 'info') {
  const existing = document.getElementById('__chrome-goods-download-notify');
  if (existing) existing.remove();

  const colors = {
    info: { bg: '#3b82f6', text: '#fff' },
    success: { bg: '#22c55e', text: '#fff' },
    error: { bg: '#ef4444', text: '#fff' }
  };
  const color = colors[type] || colors.info;

  const bar = document.createElement('div');
  bar.id = '__chrome-goods-download-notify';
  bar.innerHTML = `
    <style>
      #__chrome-goods-download-notify {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        padding: 12px 24px;
        background: ${color.bg};
        color: ${color.text};
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: __notifySlideIn 0.2s ease-out;
      }
      @keyframes __notifySlideIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    </style>
    <span>${message}</span>
  `;
  document.body.appendChild(bar);
}

function hideNotification() {
  const bar = document.getElementById('__chrome-goods-download-notify');
  if (bar) bar.remove();
}

/**
 * Extract main product images (主图) from page DOM
 * @returns {string[]} Array of normalized image URLs
 */
function extractMainImages() {
  const images = [];

  // Main images: img with class containing "thumbnailPic"
  const mainImgElements = document.querySelectorAll('img[class*="thumbnailPic"]');
  mainImgElements.forEach(img => {
    // Use data-src first (if available), then src
    const url = img.dataset.src || img.src;
    if (url && isValidImageUrl(url)) {
      images.push(normalizeImageUrl(url));
    }
  });

  return [...new Set(images)];
}

/**
 * Extract detail/description images (详情图) from page DOM
 * @returns {string[]} Array of normalized image URLs
 */
function extractDetailImages() {
  const images = [];

  // Detail images: img with class containing "descV8-singleImage-image" AND data-name="singleImage"
  let detailImgElements = document.querySelectorAll('img[class*="descV8-singleImage-image"][data-name="singleImage"]');

  // If not found in main document, try iframes
  if (detailImgElements.length === 0) {
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const iframeImgs = iframeDoc.querySelectorAll('img[class*="descV8-singleImage-image"][data-name="singleImage"]');
          if (iframeImgs.length > 0) {
            detailImgElements = iframeImgs;
            break;
          }
        }
      } catch (e) {
        // Cross-origin iframe, cannot access
      }
    }
  }

  detailImgElements.forEach(img => {
    // Priority: data-src > src (since src might be placeholder)
    const url = img.dataset.src || img.src;
    // Skip if URL is the placeholder
    if (!url || url.includes('g.alicdn.com/s.gif')) return;
    if (url && isValidImageUrl(url)) {
      images.push(normalizeImageUrl(url));
    }
  });

  return [...new Set(images)];
}

/**
 * Extract product title from page
 * @returns {string}
 */
function extractProductTitle() {
  // Try the mainTitle span first
  const titleSpan = document.querySelector('span.mainTitle--R75fTcZL');
  if (titleSpan) {
    return titleSpan.textContent.trim() || titleSpan.getAttribute('title') || '';
  }
  // Fallback to page title
  return document.title || '';
}

/**
 * Extract page data (main and detail images)
 * @returns {Promise<{platform: string, mainImages: string[], detailImages: string[], pageTitle: string, url: string, error: boolean}>}
 */
async function extractPageData() {
  showNotification('正在识别图片...', 'info');

  const platform = detectPlatform();

  // Small delay to let images render
  await new Promise(resolve => setTimeout(resolve, 300));

  const mainImages = extractMainImages();
  const detailImages = extractDetailImages();
  const productTitle = extractProductTitle();

  showNotification(`识别完成：主图 ${mainImages.length} 张，详情图 ${detailImages.length} 张`, 'success');
  setTimeout(hideNotification, 2000);

  return {
    platform,
    mainImages,
    detailImages,
    productTitle,
    pageTitle: document.title,
    url: window.location.href,
    error: false
  };
}
function sendPageDataToBackground() {
  extractPageData().then((pageData) => {
    chrome.runtime.sendMessage(
      { type: MESSAGE_TYPES.PAGE_DATA, data: pageData },
      () => {}
    );
  });
}

// Listen for messages from background or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[chrome-goods-download] Content script received message:', message);

  if (message.type === MESSAGE_TYPES.GET_PAGE_DATA) {
    const platform = detectPlatform();

    if (!platform) {
      sendUnsupportedMessage('This page is not a Taobao or Tmall page.');
      sendResponse({ status: 'error', reason: 'unsupportedPlatform' });
      return true;
    }

    if (!isDetailPage(platform)) {
      sendUnsupportedMessage('This page does not appear to be a product detail page.');
      sendResponse({ status: 'error', reason: 'notDetailPage' });
      return true;
    }

    // Page is valid — extract images
    setTimeout(async () => {
      const pageData = await extractPageData();
      console.log('[chrome-goods-download] Extracted pageData:', pageData.mainImages.length, 'main images,', pageData.detailImages.length, 'detail images');
      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.PAGE_DATA, data: pageData },
        () => {}
      );
    }, 200);

    sendResponse({ status: 'extracting' });
  } else {
    sendResponse({ status: 'ready' });
  }

  return true;
});

