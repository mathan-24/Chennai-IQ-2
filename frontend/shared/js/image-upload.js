/**
 * ROUTE-IQ — Image Upload & Evidence Processing Helper
 * Provides drag-and-drop file upload, file picker, camera capture,
 * and high-definition photo presets for incident evidence.
 */

import { INCIDENT_PHOTO_PRESETS } from './store.js';
import { dialog } from './dialog.js';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function setupImageUploader({
  dropzoneEl,
  fileInputEl,
  previewContainerEl,
  presetsContainerEl,
  onImageSelected
}) {
  let currentImageData = null;
  let isUserUpload = false;

  // Render photo presets if container provided
  if (presetsContainerEl) {
    presetsContainerEl.innerHTML = `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="label-caps" style="font-size: 10px; color: var(--color-primary-bright); display: block;">
            EVIDENCE PHOTO PRESETS (DEMO):
          </span>
          <span class="badge-status badge-under-review" style="font-size: 9px; padding: 1px 6px;">DEMO DATA</span>
        </div>
        <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;">
          ${INCIDENT_PHOTO_PRESETS.map(preset => `
            <button type="button" class="preset-photo-chip" data-url="${preset.url}" data-title="${preset.title}" style="display: flex; align-items: center; gap: 6px; background: var(--bg-surface-high); border: 1px solid var(--border-outline); padding: 4px 8px; border-radius: var(--radius-sm); color: #FFF; font-size: 11px; cursor: pointer; white-space: nowrap; transition: all 0.2s;">
              <img src="${preset.thumb}" style="width: 20px; height: 20px; border-radius: 3px; object-fit: cover;" alt="${preset.title}" />
              <span>${preset.title}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    presetsContainerEl.querySelectorAll('.preset-photo-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.getAttribute('data-url');
        const title = btn.getAttribute('data-title');
        isUserUpload = false;
        setImage(url, title, false);
      });
    });
  }

  // Handle Drag and Drop
  if (dropzoneEl) {
    dropzoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzoneEl.classList.add('drag-over');
    });

    dropzoneEl.addEventListener('dragleave', () => {
      dropzoneEl.classList.remove('drag-over');
    });

    dropzoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzoneEl.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    });

    dropzoneEl.addEventListener('click', () => {
      if (fileInputEl) fileInputEl.click();
    });
  }

  // Handle File Input Change
  if (fileInputEl) {
    fileInputEl.addEventListener('change', () => {
      if (fileInputEl.files && fileInputEl.files[0]) {
        processFile(fileInputEl.files[0]);
      }
    });
  }

  function processFile(file) {
    if (!file.type.startsWith('image/')) {
      dialog.toast('Invalid file format. Please upload an image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      dialog.toast(`Image size exceeds 5MB limit (${sizeMb} MB). Please select a compressed photo.`, 'critical');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      isUserUpload = true;
      const sizeKb = Math.round(file.size / 1024);
      setImage(e.target.result, `${file.name} (${sizeKb} KB)`, true);
      dialog.toast(`Photo uploaded: ${file.name}`, 'success', 2500);
    };
    reader.readAsDataURL(file);
  }

  function setImage(dataUrl, label = 'Evidence Photo', isRealUpload = false) {
    currentImageData = dataUrl;
    isUserUpload = isRealUpload;

    if (previewContainerEl) {
      previewContainerEl.style.display = 'block';
      previewContainerEl.innerHTML = `
        <div style="position: relative; width: 100%; height: 160px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid ${isRealUpload ? 'var(--color-success)' : 'var(--color-primary)'}; margin-top: 8px;">
          <img src="${dataUrl}" alt="Evidence Preview" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; top: 6px; left: 6px;">
            <span class="badge-status ${isRealUpload ? 'badge-verified' : 'badge-under-review'}" style="font-size: 9px;">
              ${isRealUpload ? '● REAL UPLOAD' : 'DEMO PRESET'}
            </span>
          </div>
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); padding: 4px 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #FFF;">
            <span class="data-mono" style="color: ${isRealUpload ? 'var(--color-success)' : 'var(--color-primary-bright)'}; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75%;">
              ✔ ${label}
            </span>
            <button type="button" id="btn-remove-evidence-img" style="background: none; border: none; color: var(--color-critical); cursor: pointer; display: flex; align-items: center; font-size: 11px;">
              <span class="material-symbols-outlined" style="font-size: 14px;">delete</span> Remove
            </button>
          </div>
        </div>
      `;

      const removeBtn = previewContainerEl.querySelector('#btn-remove-evidence-img');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          clearImage();
        });
      }
    }

    if (onImageSelected) {
      onImageSelected({ dataUrl: currentImageData, isUserUpload: isUserUpload });
    }
  }

  function clearImage() {
    currentImageData = null;
    isUserUpload = false;
    if (fileInputEl) fileInputEl.value = '';
    if (previewContainerEl) {
      previewContainerEl.innerHTML = '';
      previewContainerEl.style.display = 'none';
    }
    if (onImageSelected) {
      onImageSelected(null);
    }
  }

  return {
    getImage: () => currentImageData,
    isUserUploaded: () => isUserUpload,
    setImage,
    clearImage
  };
}
