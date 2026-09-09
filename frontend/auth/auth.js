/**
 * CHENNAI-IQ — Authentication & Multi-Stage Verification Logic
 * Handles initial credential check, animated verification sequence,
 * and role-specific second stage verification.
 * 
 * Pure Vanilla JavaScript (No React / No Vite).
 */

import { store } from '../shared/js/store.js';
import { api } from '../shared/js/api.js';
import { dialog } from '../shared/js/dialog.js';

let authCallback = null;
let currentPendingRole = 'CONTROL_ROOM';

export function initAuth(onAuthenticatedCallback) {
  authCallback = onAuthenticatedCallback;

  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const togglePassBtn = document.getElementById('toggle-password-btn');
  const loginError = document.getElementById('login-error');

  // Password Visibility Toggle
  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';
      const icon = togglePassBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = isPass ? 'visibility' : 'visibility_off';
    });
  }

  // Demo Account Quick Fills
  document.querySelectorAll('.demo-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const email = chip.getAttribute('data-email');
      const pass = chip.getAttribute('data-pass');
      if (emailInput && email) emailInput.value = email;
      if (passwordInput && pass) passwordInput.value = pass;
      if (loginError) loginError.style.display = 'none';
      dialog.toast(`Preset selected: ${email}`, 'info', 2000);
    });
  });

  // Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : '';
      const pass = passwordInput ? passwordInput.value.trim() : '';

      if (!email) {
        if (loginError) {
          loginError.textContent = 'Please enter an official identifier or email.';
          loginError.style.display = 'block';
        }
        dialog.toast('Please enter your official email or identifier.', 'warning');
        return;
      }

      if (loginError) loginError.style.display = 'none';

      // Step 1: Start Verifying Account transition
      showVerifyingAccountTransition(async () => {
        try {
          const session = await api.login(email, pass);
          currentPendingRole = session?.role || detectRoleFromEmail(email);
        } catch (err) {
          console.warn('[AUTH] API login fallback:', err);
          const session = store.login(email, pass);
          currentPendingRole = session?.role || detectRoleFromEmail(email);
        }
        // Step 2: Show role-specific second stage
        showSecondStageVerification(currentPendingRole);
      });
    });
  }

  // Bind Second-Stage Forms & Buttons Persistently
  bindSecondStageHandlers();
}

function detectRoleFromEmail(email) {
  const low = (email || '').toLowerCase();
  if (low.includes('driver') || low.includes('rajesh') || low.includes('trk')) return 'DRIVER';
  if (low.includes('officer') || low.includes('selvam') || low.includes('field') || low.includes('fo')) return 'FIELD_OFFICER';
  return 'CONTROL_ROOM';
}

function bindSecondStageHandlers() {
  // Driver Form
  const driverForm = document.getElementById('driver-verify-form');
  const btnVerifyDriver = document.getElementById('btn-verify-driver');
  if (driverForm) {
    driverForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSecondStageVerification('DRIVER');
    });
  }
  if (btnVerifyDriver) {
    btnVerifyDriver.addEventListener('click', (e) => {
      e.preventDefault();
      executeSecondStageVerification('DRIVER');
    });
  }

  // Field Officer Form
  const officerForm = document.getElementById('officer-verify-form');
  const btnVerifyOfficer = document.getElementById('btn-verify-officer');
  if (officerForm) {
    officerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSecondStageVerification('FIELD_OFFICER');
    });
  }
  if (btnVerifyOfficer) {
    btnVerifyOfficer.addEventListener('click', (e) => {
      e.preventDefault();
      executeSecondStageVerification('FIELD_OFFICER');
    });
  }

  // Control Room Form
  const controlForm = document.getElementById('control-verify-form');
  const btnVerifyControl = document.getElementById('btn-verify-control');
  if (controlForm) {
    controlForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeSecondStageVerification('CONTROL_ROOM');
    });
  }
  if (btnVerifyControl) {
    btnVerifyControl.addEventListener('click', (e) => {
      e.preventDefault();
      executeSecondStageVerification('CONTROL_ROOM');
    });
  }
}

export async function executeSecondStageVerification(explicitRole) {
  const role = explicitRole || currentPendingRole || store.getState().session?.role || 'CONTROL_ROOM';
  
  let payload = {};
  if (role === 'DRIVER') {
    const uid = document.getElementById('driver-user-id')?.value || 'DRV-104';
    const vid = document.getElementById('driver-vehicle-no')?.value || 'TRK-104';
    payload = { userId: uid, vehicleNumber: vid };
  } else if (role === 'FIELD_OFFICER') {
    const oid = document.getElementById('officer-id-input')?.value || 'FO-104';
    payload = { officerId: oid };
  } else {
    const cid = document.getElementById('control-id-input')?.value || 'CR-01';
    payload = { userId: cid };
  }

  // Indicate loading state on active button
  const activeBtn = document.querySelector(`#${role === 'DRIVER' ? 'driver' : role === 'FIELD_OFFICER' ? 'officer' : 'control'}-verify-form button[type="submit"]`)
    || document.getElementById(`btn-verify-${role === 'DRIVER' ? 'driver' : role === 'FIELD_OFFICER' ? 'officer' : 'control'}`);
  
  const originalText = activeBtn ? activeBtn.innerHTML : '';
  if (activeBtn) {
    activeBtn.disabled = true;
    activeBtn.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s infinite; font-size: 16px;">sync</span> VERIFYING CREDENTIALS...';
  }

  try {
    await api.verifySecondStage(payload);
  } catch (err) {
    console.warn('[AUTH] Second stage API error, fallback to local store:', err);
    store.verifySecondStage(payload);
  }

  // Unlock and proceed
  setTimeout(() => {
    if (activeBtn) {
      activeBtn.disabled = false;
      activeBtn.innerHTML = originalText || 'VERIFIED <span class="material-symbols-outlined" style="font-size: 16px;">check</span>';
    }

    if (role === 'DRIVER') {
      dialog.toast('Driver Identity (DRV-104) & Ashok Leyland 4x4 (TRK-104) Verified.', 'success', 3500);
    } else if (role === 'FIELD_OFFICER') {
      dialog.toast('Field Officer Recon Badge (FO-02 / Sub-Inspector Selvam) Verified.', 'success', 3500);
    } else {
      dialog.toast('Control Room Command Authority (CR-01 / Commander Ramanathan) Verified.', 'success', 3500);
    }

    if (typeof authCallback === 'function') {
      authCallback(role);
    } else if (window.RouteIQ?.switchRoleView) {
      window.RouteIQ.switchRoleView(role);
    } else {
      switchView(role === 'DRIVER' ? 'view-driver' : role === 'FIELD_OFFICER' ? 'view-field-officer' : 'view-control-room');
    }
  }, 400);
}

export function showVerifyingAccountTransition(onComplete) {
  switchView('view-verifying');

  const step1 = document.getElementById('verify-step-1');
  const step2 = document.getElementById('verify-step-2');
  const step3 = document.getElementById('verify-step-3');

  if (step1) {
    step1.classList.add('opacity-40');
    const icon = step1.querySelector('.check-item-icon');
    if (icon) {
      icon.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">radio_button_unchecked</span>';
      icon.classList.remove('check-item-done');
    }
  }

  if (step2) {
    step2.classList.add('opacity-40');
    const icon = step2.querySelector('.check-item-icon');
    if (icon) {
      icon.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">radio_button_unchecked</span>';
      icon.classList.remove('check-item-done');
    }
  }

  if (step3) {
    step3.classList.add('opacity-40');
  }

  setTimeout(() => {
    if (step1) {
      step1.classList.remove('opacity-40');
      const icon = step1.querySelector('.check-item-icon');
      if (icon) {
        icon.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span>';
        icon.classList.add('check-item-done');
      }
    }
  }, 350);

  setTimeout(() => {
    if (step2) {
      step2.classList.remove('opacity-40');
      const icon = step2.querySelector('.check-item-icon');
      if (icon) {
        icon.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span>';
        icon.classList.add('check-item-done');
      }
    }
  }, 750);

  setTimeout(() => {
    if (step3) {
      step3.classList.remove('opacity-40');
    }
  }, 1100);

  setTimeout(() => {
    if (onComplete) onComplete();
  }, 1400);
}

export function showSecondStageVerification(role) {
  currentPendingRole = role || 'CONTROL_ROOM';
  switchView('view-second-stage');

  const driverForm = document.getElementById('driver-verify-form');
  const officerForm = document.getElementById('officer-verify-form');
  const controlForm = document.getElementById('control-verify-form');

  if (driverForm) driverForm.style.display = 'none';
  if (officerForm) officerForm.style.display = 'none';
  if (controlForm) controlForm.style.display = 'none';

  if (role === 'DRIVER') {
    if (driverForm) driverForm.style.display = 'flex';
  } else if (role === 'FIELD_OFFICER') {
    if (officerForm) officerForm.style.display = 'flex';
  } else {
    if (controlForm) controlForm.style.display = 'flex';
  }
}

export function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active-view');
  });
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active-view');
  }
}
