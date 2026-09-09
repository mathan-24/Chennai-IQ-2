/**
 * ROUTE-IQ — Central Modal Dialog & Toast Notification Engine
 * Replaces intrusive browser alerts with accessible, tactical HUD notifications
 * and confirmation sheets.
 */

class DialogManager {
  constructor() {
    this.toastContainer = null;
    this.confirmBackdrop = null;
    this.initContainers();
  }

  initContainers() {
    // Toast Container
    if (!document.getElementById('routeiq-toast-container')) {
      const tc = document.createElement('div');
      tc.id = 'routeiq-toast-container';
      tc.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        max-width: 380px;
        width: calc(100vw - 40px);
      `;
      document.body.appendChild(tc);
      this.toastContainer = tc;
    } else {
      this.toastContainer = document.getElementById('routeiq-toast-container');
    }

    // Modal Confirmation Backdrop
    if (!document.getElementById('routeiq-confirm-modal')) {
      const mb = document.createElement('div');
      mb.id = 'routeiq-confirm-modal';
      mb.className = 'modal-backdrop';
      mb.style.zIndex = '99998';
      mb.innerHTML = `
        <div class="modal-sheet" style="max-width: 480px; padding: 0; overflow: hidden; border: 1px solid var(--border-outline);">
          <div id="routeiq-confirm-header" style="padding: 14px 18px; background: var(--bg-input); border-bottom: 1px solid var(--border-outline); display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span id="routeiq-confirm-icon" class="material-symbols-outlined" style="font-size: 20px; color: var(--color-primary-bright);">verified</span>
              <span id="routeiq-confirm-title" class="label-caps" style="color: #FFF; letter-spacing: 0.08em; font-size: 11px;">CONFIRM ACTION</span>
            </div>
            <button type="button" id="routeiq-confirm-close" class="btn-icon" style="width: 28px; height: 28px;">
              <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
            </button>
          </div>
          <div style="padding: 20px;">
            <div id="routeiq-confirm-body" style="font-size: 13px; color: var(--text-on-surface); line-height: 1.5; white-space: pre-line;"></div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button type="button" id="routeiq-confirm-cancel" class="btn-secondary" style="padding: 8px 16px; font-size: 12px;">CANCEL</button>
              <button type="button" id="routeiq-confirm-ok" class="btn-primary" style="padding: 8px 18px; font-size: 12px;">CONFIRM</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(mb);
      this.confirmBackdrop = mb;
    } else {
      this.confirmBackdrop = document.getElementById('routeiq-confirm-modal');
    }
  }

  /**
   * Display a non-blocking tactical HUD toast
   * @param {string} message 
   * @param {'info'|'success'|'warning'|'critical'} type 
   * @param {number} duration 
   */
  toast(message, type = 'info', duration = 3500) {
    if (!this.toastContainer) this.initContainers();

    const toastEl = document.createElement('div');
    toastEl.style.cssText = `
      pointer-events: auto;
      background: rgba(15, 23, 23, 0.95);
      border: 1px solid var(--border-outline);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(12px);
      transition: opacity 0.2s, transform 0.2s;
    `;

    let icon = 'info';
    let iconColor = 'var(--color-primary-bright)';
    let borderColor = 'var(--color-primary)';

    if (type === 'success') {
      icon = 'check_circle';
      iconColor = 'var(--color-success)';
      borderColor = 'var(--color-success)';
    } else if (type === 'warning') {
      icon = 'warning';
      iconColor = 'var(--color-warning)';
      borderColor = 'var(--color-warning)';
    } else if (type === 'critical' || type === 'error') {
      icon = 'error';
      iconColor = 'var(--color-critical)';
      borderColor = 'var(--color-critical)';
    }

    toastEl.style.borderLeft = `3px solid ${borderColor}`;

    toastEl.innerHTML = `
      <span class="material-symbols-outlined" style="font-size: 18px; color: ${iconColor}; flex-shrink: 0; margin-top: 1px;">${icon}</span>
      <div style="flex: 1; font-size: 12px; color: #FFF; line-height: 1.4; white-space: pre-line; word-break: break-word;">${message}</div>
      <button type="button" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; display: flex; align-items: center;">
        <span class="material-symbols-outlined" style="font-size: 14px;">close</span>
      </button>
    `;

    const closeBtn = toastEl.querySelector('button');
    closeBtn.addEventListener('click', () => {
      this.dismissToast(toastEl);
    });

    this.toastContainer.appendChild(toastEl);

    if (duration > 0) {
      setTimeout(() => {
        this.dismissToast(toastEl);
      }, duration);
    }
  }

  dismissToast(toastEl) {
    if (!toastEl || !toastEl.parentElement) return;
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      if (toastEl.parentElement) toastEl.remove();
    }, 200);
  }

  /**
   * Display a tactical confirmation sheet modal
   */
  confirm({
    title = 'CONFIRM ACTION',
    message = 'Are you sure you wish to execute this operation?',
    confirmText = 'CONFIRM & EXECUTE',
    cancelText = 'CANCEL',
    isDanger = false,
    icon = 'help',
    onConfirm = () => {},
    onCancel = () => {}
  }) {
    if (!this.confirmBackdrop) this.initContainers();

    const titleEl = document.getElementById('routeiq-confirm-title');
    const bodyEl = document.getElementById('routeiq-confirm-body');
    const okBtn = document.getElementById('routeiq-confirm-ok');
    const cancelBtn = document.getElementById('routeiq-confirm-cancel');
    const closeBtn = document.getElementById('routeiq-confirm-close');
    const iconEl = document.getElementById('routeiq-confirm-icon');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = message;
    if (iconEl) {
      iconEl.textContent = icon;
      iconEl.style.color = isDanger ? 'var(--color-critical)' : 'var(--color-primary-bright)';
    }

    if (okBtn) {
      okBtn.textContent = confirmText;
      if (isDanger) {
        okBtn.className = 'btn-danger';
      } else {
        okBtn.className = 'btn-primary';
      }
    }

    if (cancelBtn) cancelBtn.textContent = cancelText;

    const cleanup = () => {
      this.confirmBackdrop.classList.remove('open');
      document.removeEventListener('keydown', keyHandler);
    };

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        onCancel();
      }
    };

    okBtn.onclick = () => {
      cleanup();
      onConfirm();
    };

    cancelBtn.onclick = () => {
      cleanup();
      onCancel();
    };

    closeBtn.onclick = () => {
      cleanup();
      onCancel();
    };

    document.addEventListener('keydown', keyHandler);
    this.confirmBackdrop.classList.add('open');
  }

  /**
   * Display an informational modal dialog
   */
  alert(message, title = 'OPERATIONAL NOTICE') {
    this.confirm({
      title: title,
      message: message,
      confirmText: 'ACKNOWLEDGE',
      cancelText: 'CLOSE',
      icon: 'info',
      onConfirm: () => {},
      onCancel: () => {}
    });
  }
}

export const dialog = new DialogManager();
