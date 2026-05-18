// ==========================================
// TASK 1: Message handling - receive page data from content script
// ==========================================

function requestPageData() {
  chrome.runtime.sendMessage({ type: 'getPageData' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[sidepanel] Failed to request page data:', chrome.runtime.lastError.message);
    }
  });
}

function handlePageData(data) {
  console.log('[sidepanel] Handling pageData:', data);
  // Check for error state
  if (data.error) {
    const mainGrid = document.getElementById('main-grid');
    const detailGrid = document.getElementById('detail-grid');
    mainGrid.innerHTML = '<div class="empty-state">无法获取图片：该页面不是商品详情页</div>';
    detailGrid.innerHTML = '<div class="empty-state">请刷新页面后重试</div>';
    document.getElementById('main-count-badge').textContent = '(0)';
    document.getElementById('detail-count-badge').textContent = '(0)';
    updateCounts();
    return;
  }

  // Populate main images
  mainImages = data.mainImages.map((url, i) => ({
    id: 'main-' + i,
    url: url,
    checked: true
  }));

  // Populate detail images
  detailImages = data.detailImages.map((url, i) => ({
    id: 'detail-' + i,
    url: url,
    checked: true
  }));

  // Store product title for download filename
  productTitle = data.productTitle || data.pageTitle || '';

  // Render both sections
  renderSection('main', mainImages);
  renderSection('detail', detailImages);
  updateCounts();
}

// Listen for page data responses from content script via background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'pageData') {
    handlePageData(message.data);
    return true;
  }
  return true;
});

// Initial load - request page data when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  requestPageData();
});

// ==========================================
// TASK 3: Selection counting and download button wiring
// ==========================================

function updateSelectedCount() {
  const total = mainImages.filter(i => i.checked).length + detailImages.filter(i => i.checked).length;
  const countEl = document.querySelector('.image-count');
  if (countEl) {
    countEl.textContent = total > 0 ? `已选 ${total} 张` : '';
  }
  // Update download button state
  const btn = document.querySelector('.download-btn');
  if (btn) {
    btn.disabled = total === 0;
  }
}

function collectSelectedImages() {
  const selected = [
    ...mainImages.filter(i => i.checked).map(img => ({ ...img, section: 'main' })),
    ...detailImages.filter(i => i.checked).map(img => ({ ...img, section: 'detail' }))
  ];
  return selected;
}

// Wire download button click to dispatch downloadImages event
document.querySelector('.download-btn').addEventListener('click', () => {
  const selected = collectSelectedImages();
  if (selected.length === 0) return;
  // Dispatch download event (Phase 4 implementation)
  window.dispatchEvent(new CustomEvent('downloadImages', {
    detail: { images: selected, pageTitle: document.title }
  }));
});

// Wire refresh button click to re-request page data
document.querySelector('.refresh-btn').addEventListener('click', () => {
  // Clear existing images first
  mainImages = [];
  detailImages = [];
  productTitle = '';
  renderSection('main', []);
  renderSection('detail', []);
  updateCounts();
  // Re-request page data
  requestPageData();
});

// ==========================================
// TASK 3: Collapsible sections with chevron rotation
// ==========================================
let isMainSectionOpen = true;
let isDetailSectionOpen = true;

const mainSectionHeader = document.querySelector('[data-section="main"]');
const detailSectionHeader = document.querySelector('[data-section="detail"]');
const mainContent = document.getElementById('main-content');
const detailContent = document.getElementById('detail-content');

function toggleSection(section) {
  if (section === 'main') {
    isMainSectionOpen = !isMainSectionOpen;
    mainSectionHeader.setAttribute('aria-expanded', isMainSectionOpen);
    mainContent.classList.toggle('expanded', isMainSectionOpen);
    mainSectionHeader.querySelector('.chevron').classList.toggle('collapsed', !isMainSectionOpen);
  } else {
    isDetailSectionOpen = !isDetailSectionOpen;
    detailSectionHeader.setAttribute('aria-expanded', isDetailSectionOpen);
    detailContent.classList.toggle('expanded', isDetailSectionOpen);
    detailSectionHeader.querySelector('.chevron').classList.toggle('collapsed', !isDetailSectionOpen);
  }
}

mainSectionHeader.addEventListener('click', () => toggleSection('main'));
detailSectionHeader.addEventListener('click', () => toggleSection('detail'));

// ==========================================
// TASK 3: Image grid rendering with checkboxes
// ==========================================
let mainImages = [];
let detailImages = [];
let productTitle = '';

function updateCounts() {
  const mainChecked = mainImages.filter(img => img.checked).length;
  const detailChecked = detailImages.filter(img => img.checked).length;
  const totalSelected = mainChecked + detailChecked;
  const totalImages = mainImages.length + detailImages.length;

  document.getElementById('selected-count').textContent = totalSelected;
  document.getElementById('total-count').textContent = totalImages;
  document.getElementById('main-count-badge').textContent = `已选 ${mainChecked} / ${mainImages.length} 张`;
  document.getElementById('detail-count-badge').textContent = `已选 ${detailChecked} / ${detailImages.length} 张`;

  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.disabled = totalSelected === 0;
}

function createImageItem(image, section) {
  const item = document.createElement('div');
  item.className = 'image-item';
  item.dataset.id = image.id;

  const img = document.createElement('img');
  img.src = image.url;
  img.alt = 'Product image';
  img.loading = 'lazy';
  img.onerror = function() {
    this.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%232a2a2a%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23666%22 font-size=%2212%22>!</text></svg>';
  };

  const checkbox = document.createElement('div');
  checkbox.className = 'checkbox' + (image.checked ? ' checked' : '');
  checkbox.dataset.id = image.id;
  checkbox.innerHTML = '<span class="iconify iconify-check" data-icon="material-symbols:check"></span>';

  // Checkbox click - toggle selection without opening modal
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    image.checked = !image.checked;
    checkbox.classList.toggle('checked', image.checked);
    updateCounts();
  });

  // Image item click - open modal (not when clicking checkbox)
  item.addEventListener('click', (e) => {
    if (e.target.closest('.checkbox')) return;
    openModal(image.url);
  });

  item.appendChild(img);
  item.appendChild(checkbox);
  return item;
}

function renderSection(section, images) {
  const gridId = section === 'main' ? 'main-grid' : 'detail-grid';
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';

  if (images.length === 0) {
    grid.innerHTML = '<div class="empty-state">暂无图片</div>';
    return;
  }

  images.forEach(image => {
    grid.appendChild(createImageItem(image, section));
  });
}

// ==========================================
// TASK 4: Modal open/close interactions
// ==========================================
let modalOpen = false;
let modalImageUrl = null;

const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');

function openModal(imageUrl) {
  modalOpen = true;
  modalImageUrl = imageUrl;
  modalImage.src = imageUrl;
  modal.style.display = 'flex';
  // Force reflow for animation
  modal.offsetHeight;
  modal.classList.remove('hidden');
  modal.classList.add('visible');
}

function closeModal() {
  if (!modalOpen) return;
  modal.classList.remove('visible');
  modal.classList.add('hidden');
  setTimeout(() => {
    modal.style.display = 'none';
    modalImage.src = '';
    modalOpen = false;
    modalImageUrl = null;
  }, 150);
}

// Modal close triggers
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

// Escape key closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOpen) {
    closeModal();
  }
});

// ==========================================
// TASK 5: Download helpers (Phase 4)
// ==========================================

async function fetchImageAsJpgBlob(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer]);
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((jpgBlob) => {
          URL.revokeObjectURL(objectUrl);
          if (jpgBlob) resolve(jpgBlob);
          else reject(new Error('Canvas toBlob returned null'));
        }, 'image/jpeg', 0.92);
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim().substring(0, 200);
}

// ==========================================
// TASK 5: Download event listener (Phase 4)
// ==========================================

window.addEventListener('downloadImages', async (event) => {
  const { images, pageTitle } = event.detail;
  const checkedImages = images.filter(img => img.checked);

  if (checkedImages.length === 0) return;

  const downloadBtn = document.getElementById('download-btn');
  const originalText = downloadBtn.innerHTML;
  downloadBtn.disabled = true;
  downloadBtn.innerHTML = '<span class="iconify" data-icon="material-symbols:hourglass-empty"></span> 处理中...';

  const zip = new JSZip();
  const sanitizedTitle = sanitizeFilename(productTitle) || sanitizeFilename(pageTitle) || 'download';

  // Process images in batches of 5 for memory management
  const batchSize = 5;
  let processed = 0;
  let failedCount = 0;

  try {
    for (let i = 0; i < checkedImages.length; i += batchSize) {
      const batch = checkedImages.slice(i, i + batchSize);
      try {
        const jpgBlobs = await Promise.all(
          batch.map(img => fetchImageAsJpgBlob(img.url))
        );
        jpgBlobs.forEach((blob, idx) => {
          const fileName = `${String(i + idx + 1).padStart(3, '0')}.jpg`;
          const folder = checkedImages[i + idx].section === 'main' ? '主图' : '详情图';
          zip.folder(folder).file(fileName, blob);
        });
        processed += jpgBlobs.length;
      } catch (err) {
        console.warn('Image processing failed:', err);
        failedCount += batch.length;
        // Continue with next batch
      }
    }

    // Generate zip and trigger download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${sanitizedTitle}.zip`);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = originalText;
  }

  if (failedCount > 0) {
    alert(`${failedCount} 张图片下载失败，已跳过`);
  }
});