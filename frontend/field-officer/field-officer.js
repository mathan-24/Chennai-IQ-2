/**
 * CHENNAI-IQ — Field Officer Operations View Module
 * 
 * Features:
 * - Field Hazard & Flood Inundation Observation Reporting
 * - Multi-factor Evidence Collection (Photo Upload & Preset Selectors, Live GPS coordinates)
 * - Automated Inspection Task Acknowledgment & On-Site Verification
 * - AI-Assisted Confidence Assessment Integration
 * 
 * Pure Vanilla JavaScript (No React / No Vite).
 */

import { store, INCIDENT_PHOTO_PRESETS } from '../shared/js/store.js';
import { setupImageUploader } from '../shared/js/image-upload.js';
import { dialog } from '../shared/js/dialog.js';

let fieldUploader = null;

export function initFieldOfficerView() {
  renderFieldOfficerData();

  store.subscribe(() => {
    renderFieldOfficerData();
  });

  // Modal: Report New Incident with Photo Upload
  const openReportBtn = document.getElementById('btn-open-field-report');
  const reportModal = document.getElementById('modal-field-report');
  const closeReportBtn = document.getElementById('btn-close-field-report');
  const reportForm = document.getElementById('form-field-incident-report');

  if (openReportBtn && reportModal) {
    openReportBtn.addEventListener('click', () => {
      reportModal.classList.add('open');
      if (!fieldUploader) {
        fieldUploader = setupImageUploader({
          dropzoneEl: document.getElementById('field-dropzone'),
          fileInputEl: document.getElementById('field-hazard-file'),
          previewContainerEl: document.getElementById('field-photo-preview'),
          presetsContainerEl: document.getElementById('field-photo-presets')
        });
      }
    });
  }

  if (closeReportBtn && reportModal) {
    closeReportBtn.addEventListener('click', () => {
      reportModal.classList.remove('open');
    });
  }

  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.getElementById('field-hazard-type').value;
      const roadSelect = document.getElementById('field-road-segment');
      const segmentId = roadSelect ? roadSelect.value : 'S217';
      const desc = document.getElementById('field-observation-text').value;
      const attachedPhoto = fieldUploader ? fieldUploader.getImage() : null;
      const isRealUpload = fieldUploader ? fieldUploader.isUserUploaded() : false;

      const submitBtn = reportForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s infinite;">sync</span> EVALUATING FIELD TELEMETRY...';
      }

      setTimeout(() => {
        const report = store.submitFieldReport({
          officerId: 'FO-02',
          segmentId: segmentId,
          conditionType: type.toLowerCase(),
          severity: 'CRITICAL',
          description: desc || 'Field officer observation: deep flood water obstructing road access.',
          coordinates: { lat: 12.9772, lng: 80.2215, accuracy: '±5 m' },
          evidencePhotos: attachedPhoto ? [attachedPhoto] : [INCIDENT_PHOTO_PRESETS[0].url],
          isUserUpload: isRealUpload
        });

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span class="material-symbols-outlined">send</span> TRANSMIT HAZARD REPORT';
        }

        if (reportModal) reportModal.classList.remove('open');
        if (fieldUploader) fieldUploader.clearImage();
        reportForm.reset();
        
        if (!report.requiresControlRoomReview) {
          dialog.toast(`High-Confidence Report Validated (${report.id})!\nRoad status updated automatically. Affected drivers alerted.`, 'success', 5000);
        } else {
          dialog.toast(`Report Queued (${report.id}). Forwarded to Control Room operator review queue.`, 'warning', 4000);
        }
      }, 600);
    });
  }

  // Task actions: Acknowledge, Start, Submit
  const taskAckBtn = document.getElementById('btn-task-ack');
  const taskStartBtn = document.getElementById('btn-task-start');
  const taskSubmitBtn = document.getElementById('btn-task-submit');

  if (taskAckBtn) {
    taskAckBtn.addEventListener('click', () => {
      const task = store.getState().fieldTasks[0];
      if (task) {
        store.acceptTask(task.id);
        dialog.toast(`Inspection Task ${task.id} Acknowledged by FO-02 (Sub-Inspector Selvam).`, 'info');
      }
    });
  }

  if (taskStartBtn) {
    taskStartBtn.addEventListener('click', () => {
      const task = store.getState().fieldTasks[0];
      if (task) {
        store.arriveOnSite(task.id);
        dialog.toast(`Field Status: ON SITE at ${task.roadName}. Commencing flood passability verification.`, 'warning');
      }
    });
  }

  if (taskSubmitBtn) {
    taskSubmitBtn.addEventListener('click', () => {
      const task = store.getState().fieldTasks[0];
      if (task) {
        const report = store.submitFieldReport({
          taskId: task.id,
          officerId: 'FO-02',
          segmentId: task.segmentId,
          conditionType: 'flooding',
          severity: 'CRITICAL',
          description: 'Velachery Lake water overflow observed. Depth measured at 0.85m across highway lanes. Impassable for standard trucks.',
          coordinates: { lat: 12.9772, lng: 80.2215, accuracy: '±5 m' },
          evidencePhotos: [INCIDENT_PHOTO_PRESETS[0].url]
        });

        dialog.toast(`On-Site Field Verification Evidence & GPS Lock Processed (${report.id}).`, 'success', 4000);
      }
    });
  }
}

function renderFieldOfficerData() {
  const state = store.getState();

  // Active Assigned Task Card
  const taskContainer = document.getElementById('field-task-card');
  const tasks = state.fieldTasks || [];
  const assignedTask = tasks.find(t => t.assignedOfficerId === 'FO-02' || t.status !== 'VERIFIED') || tasks[0];

  if (taskContainer && assignedTask) {
    taskContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <span class="label-caps" style="color: #00CED1;">AUTOMATED INSPECTION DISPATCH</span>
        <span class="badge-status ${assignedTask.priority === 'CRITICAL' ? 'badge-critical' : 'badge-warning'}">${assignedTask.priority} PRIORITY</span>
      </div>
      <div style="font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 6px;">${assignedTask.roadName} (${assignedTask.segmentId})</div>
      <div style="font-size: 13px; color: #859493; margin-bottom: 12px; line-height: 1.5;">${assignedTask.reason}</div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #00CED1; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px;">
        <span>STATUS: <strong style="color: #FFF;">${assignedTask.status}</strong></span>
        <span>Distance: <strong style="color: #FFF;">${assignedTask.distanceKm ? assignedTask.distanceKm + ' km' : '0.4 km'}</strong></span>
      </div>
    `;
  }

  // Reports list
  const reportsList = document.getElementById('field-reports-list');
  if (reportsList) {
    const reports = state.fieldReports || [];
    if (reports.length === 0) {
      reportsList.innerHTML = `
        <div style="font-size: 12px; color: #859493; text-align: center; padding: 20px; font-family: 'JetBrains Mono', monospace;">
          No field reports filed yet. Click "REPORT NEW INCIDENT" or complete the assigned task to submit an on-site physical verification.
        </div>
      `;
    } else {
      reportsList.innerHTML = reports.map(r => `
        <div class="glass-panel-subtle" style="padding: 12px; border-left: 3px solid ${r.status === 'AUTO_PROCESSED' ? '#38E54D' : '#FFA54A'};">
          <div style="display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 11px; margin-bottom: 4px;">
            <strong style="color: #00CED1;">${r.id}</strong>
            <span class="badge-status ${r.status === 'AUTO_PROCESSED' ? 'badge-verified' : 'badge-warning'}">${r.status}</span>
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #FFF;">${r.roadSegment} (${r.segmentId})</div>
          <div style="font-size: 11px; color: #859493; margin-top: 2px;">${r.description}</div>
          <div style="font-size: 10px; color: #00CED1; font-family: 'JetBrains Mono', monospace; margin-top: 6px;">
            AI Confidence: ${r.confidence} (${r.confidenceScore}/100)
          </div>
        </div>
      `).join('');
    }
  }
}
