console.log('chrome-goods-download content script injected');

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
 * Check if URL is a valid product image (exclude tracking pixels, icons)
 * @param {string} url
 * @returns {boolean}
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  // Exclude tracking pixels and icons
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('pixel') || lowerUrl.includes('1.gif') ||
      lowerUrl.includes('data:image') || lowerUrl.includes('blank.gif')) {
    return false;
  }
  // Must be from known Alibaba CDN domains
  if (!lowerUrl.includes('alicdn.com') && !lowerUrl.includes('alibaba.com') &&
      !lowerUrl.includes('taobao.com') && !lowerUrl.includes('tmall.com')) {
    // Allow if it's a full http(s) URL we can't verify, but reject obvious non-CDN
    if (lowerUrl.startsWith('http') && !lowerUrl.includes('img')) {
      return false;
    }
  }
  return true;
}

/**
 * Extract main product images (主图) from page DOM
 * @returns {string[]} Array of normalized image URLs
 */
function extractMainImages() {
  const images = [];

  // Strategy 1: g_Config (primary on most pages)
  if (window.g_Config) {
    const config = window.g_Config;

    // auctionImages - direct array of URLs
    if (config.auctionImages && Array.isArray(config.auctionImages)) {
      config.auctionImages.forEach(url => {
        if (typeof url === 'string' && isValidImageUrl(url)) {
          images.push(normalizeImageUrl(url));
        }
      });
    }

    // itemPicMaps - object with numeric keys
    if (config.itemPicMaps && typeof config.itemPicMaps === 'object') {
      Object.values(config.itemPicMaps).forEach(value => {
        if (typeof value === 'string' && isValidImageUrl(value)) {
          images.push(normalizeImageUrl(value));
        }
      });
    }

    // Nested: itemInfoModel.itemImage or itemInfoModel.pictures
    if (config.itemInfoModel) {
      const itemInfo = config.itemInfoModel;
      if (itemInfo.itemImage) {
        const arr = Array.isArray(itemInfo.itemImage) ? itemInfo.itemImage : [itemInfo.itemImage];
        arr.forEach(url => {
          if (typeof url === 'string' && isValidImageUrl(url)) {
            images.push(normalizeImageUrl(url));
          }
        });
      }
      if (itemInfo.pictures && Array.isArray(itemInfo.pictures)) {
        itemInfo.pictures.forEach(url => {
          if (typeof url === 'string' && isValidImageUrl(url)) {
            images.push(normalizeImageUrl(url));
          }
        });
      }
    }
  }

  // Strategy 2: TB.Config (older Taobao pages)
  if (window.TB && window.TB.Config && images.length === 0) {
    const config = TB.Config;
    if (config.auctionImages && Array.isArray(config.auctionImages)) {
      config.auctionImages.forEach(url => {
        if (typeof url === 'string' && isValidImageUrl(url)) {
          images.push(normalizeImageUrl(url));
        }
      });
    }
    if (config.itemPicMaps && typeof config.itemPicMaps === 'object') {
      Object.values(config.itemPicMaps).forEach(value => {
        if (typeof value === 'string' && isValidImageUrl(value)) {
          images.push(normalizeImageUrl(value));
        }
      });
    }
  }

  // Strategy 3: g_fixedBigPic (sometimes used for main image)
  if (window.g_fixedBigPic && images.length === 0) {
    const arr = Array.isArray(g_fixedBigPic) ? g_fixedBigPic : [g_fixedBigPic];
    arr.forEach(url => {
      if (typeof url === 'string' && isValidImageUrl(url)) {
        images.push(normalizeImageUrl(url));
      }
    });
  }

  // Strategy 4: __CONFIG__ (alternative naming)
  if (window.__CONFIG__ && images.length === 0) {
    const config = window.__CONFIG__;
    if (config.auctionImages && Array.isArray(config.auctionImages)) {
      config.auctionImages.forEach(url => {
        if (typeof url === 'string' && isValidImageUrl(url)) {
          images.push(normalizeImageUrl(url));
        }
      });
    }
  }

  // Deduplicate while preserving order
  return [...new Set(images)];
}

/**
 * Extract detail/description images (详情图) from page DOM
 * @returns {string[]} Array of normalized image URLs
 */
function extractDetailImages() {
  const images = [];

  // Common description container selectors (try in order)
  const selectors = [
    '#description',
    '.description',
    '[class*="description"]',
    '#J_DepictContainer',
    '.tb-detail-brief',
    '#module_promo_ensure_item_detail'
  ];

  let descContainer = null;
  for (const sel of selectors) {
    descContainer = document.querySelector(sel);
    if (descContainer) break;
  }

  if (descContainer) {
    // Extract from data-src first (lazy-loaded), then data_lazy, then src
    const imgElements = descContainer.querySelectorAll('img');
    imgElements.forEach(img => {
      const url = img.dataset.src || img.getAttribute('data_lazy') || img.src;
      if (url && isValidImageUrl(url)) {
        images.push(normalizeImageUrl(url));
      }
    });
  }

  // Deduplicate
  return [...new Set(images)];
}

/**
 * Extract full page data including images
 * @returns {Object} Page data structure with platform, mainImages, detailImages
 */
function extractPageData() {
  const platform = detectPlatform();
  const mainImages = extractMainImages();
  const detailImages = extractDetailImages();

  return {
    platform,
    mainImages,
    detailImages,
    pageTitle: document.title,
    url: window.location.href,
    error: false
  };
}
function sendPageDataToBackground() {
  const pageData = extractPageData();
  chrome.runtime.sendMessage(
    { type: MESSAGE_TYPES.PAGE_DATA, data: pageData },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to send page data:', chrome.runtime.lastError.message);
      } else {
        console.log('Page data sent to background:', response);
      }
    }
  );
}

// Listen for messages from background or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);

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

    // Page is valid — extract data after short delay for lazy content
    setTimeout(() => {
      const pageData = extractPageData();
      chrome.runtime.sendMessage(
        { type: MESSAGE_TYPES.PAGE_DATA, data: pageData },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to send page data:', chrome.runtime.lastError.message);
          }
        }
      );
    }, 200);

    sendResponse({ status: 'extracting' });
  } else {
    sendResponse({ status: 'ready' });
  }

  return true;
});

