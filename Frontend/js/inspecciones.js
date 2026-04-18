// js/inspecciones.js

// ── Abrir modal de lote individual ───────────────────────────
// Llamado desde inspeccion.html: onclick="abrirModal('LOTE-001')"
function abrirModal(loteId) {
    // TODO: implementar vista/modal de detalle para el lote
    // Por ahora muestra un toast de confirmación
    mostrarToast(`📋 Abriendo inspección para ${loteId}…`);
}

// ── Toast ─────────────────────────────────────────────────────
function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}