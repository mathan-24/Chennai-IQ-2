/**
 * ROUTE-IQ — Shared Navigation Controller
 */
export function navigateTo(url) {
  window.location.href = url;
}

export function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');
}
