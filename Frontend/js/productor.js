// ─── State ───────────────────────────────
  let rowCount = 1;
 
  // ─── Navigation ──────────────────────────
  function goToForm() {
    document.getElementById('view-table').classList.remove('active');
    document.getElementById('view-form').classList.add('active');
    resetForm();
  }
  function goToTable() {
    document.getElementById('view-form').classList.remove('active');
    document.getElementById('view-table').classList.add('active');
  }
 
  // ─── Reset ───────────────────────────────
  function resetForm() {
    ['f-nombre','f-num-predios','f-area-total','f-num-lotes','f-nombre-ro'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('predios-container').innerHTML = '';
    document.getElementById('lotes-container').innerHTML = '';
    lockSection2();
    updateCrearBtn();
    // reset step indicators
    document.getElementById('step-indicator-1').className = 'step active';
    document.getElementById('step-indicator-2').className = 'step';
    document.getElementById('connector-1').className = 'step-connector';
  }
 
  // ─── Section lock/unlock ──────────────────
  function lockSection2() {
    const s2 = document.getElementById('section-2');
    s2.style.opacity = '.45';
    s2.style.pointerEvents = 'none';
  }
  function unlockSection2() {
    const nombre = document.getElementById('f-nombre').value.trim();
    document.getElementById('f-nombre-ro').value = nombre;
    const s2 = document.getElementById('section-2');
    s2.style.opacity = '1';
    s2.style.pointerEvents = 'auto';
    // update step indicator
    document.getElementById('step-indicator-1').className = 'step done';
    document.getElementById('step-indicator-2').className = 'step active';
    document.getElementById('connector-1').className = 'step-connector done';
  }
 
  // ─── Section 1 logic ─────────────────────
  function onBasicChange() {
    checkSection1Complete();
  }
 
  function onPrediosChange() {
    const val = parseInt(document.getElementById('f-num-predios').value) || 0;
    const container = document.getElementById('predios-container');
    container.innerHTML = '';
    if (val > 0 && val <= 20) {
      for (let i = 1; i <= val; i++) {
        const div = document.createElement('div');
        div.className = 'predio-item';
        div.innerHTML = `
          <span class="predio-label">Predio ${i}</span>
          <input class="form-input predio-code" type="text" placeholder="Código del predio ${i}" oninput="checkSection1Complete()" style="flex:1;">
        `;
        container.appendChild(div);
      }
    }
    checkSection1Complete();
  }
 
  function checkSection1Complete() {
    const nombre = document.getElementById('f-nombre').value.trim();
    const numPredios = parseInt(document.getElementById('f-num-predios').value) || 0;
    const codes = [...document.querySelectorAll('.predio-code')];
    const allCodes = codes.length === numPredios && codes.every(c => c.value.trim() !== '');
    const complete = nombre !== '' && numPredios > 0 && allCodes;
    if (complete) {
      unlockSection2();
    } else {
      lockSection2();
    }
    updateCrearBtn();
  }
 
  // ─── Section 2 logic ─────────────────────
  function onDetailChange() {
    updateCrearBtn();
  }
 
  function onLotesChange() {
    const val = parseInt(document.getElementById('f-num-lotes').value) || 0;
    const container = document.getElementById('lotes-container');
    container.innerHTML = '';
 
    const estadosFenologicos = ['Germinación','Plántula','Vegetativo','Floración','Fructificación','Maduración'];
    const cultivos = ['Café','Maíz','Frijol','Papa','Cacao','Aguacate','Plátano','Arroz','Yuca','Tomate'];
 
    if (val > 0 && val <= 30) {
      for (let i = 1; i <= val; i++) {
        const card = document.createElement('div');
        card.className = 'lote-card';
        card.id = `lote-${i}`;
        card.innerHTML = `
          <div class="lote-card-header" onclick="toggleLote(${i})">
            <div class="lote-card-title">
              <span class="lote-status-dot"></span>
              Lote ${i}
            </div>
            <span class="lote-chevron">▼</span>
          </div>
          <div class="lote-card-body">
            <div class="form-row" style="margin-bottom:12px;">
              <div class="form-group">
                <label class="form-label">Área (ha) *</label>
                <input class="form-input lote-field" type="number" min="0.01" step="0.01" placeholder="Ej. 1.5"
                  data-lote="${i}" oninput="onLoteFieldChange(${i})">
              </div>
              <div class="form-group">
                <label class="form-label">Fecha de siembra *</label>
                <input class="form-input lote-field" type="date"
                  data-lote="${i}" oninput="onLoteFieldChange(${i})">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Estado fenológico *</label>
                <select class="form-select lote-field" data-lote="${i}" onchange="onLoteFieldChange(${i})">
                  <option value="">Seleccionar...</option>
                  ${estadosFenologicos.map(e => `<option>${e}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Cultivo *</label>
                <select class="form-select lote-field" data-lote="${i}" onchange="onLoteFieldChange(${i})">
                  <option value="">Seleccionar...</option>
                  ${cultivos.map(c => `<option>${c}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        `;
        container.appendChild(card);
      }
    }
    updateCrearBtn();
  }
 
  function toggleLote(i) {
    const card = document.getElementById(`lote-${i}`);
    card.classList.toggle('open');
  }
 
  function onLoteFieldChange(i) {
    const card = document.getElementById(`lote-${i}`);
    const fields = card.querySelectorAll('.lote-field');
    const complete = [...fields].every(f => f.value.trim() !== '');
    if (complete) {
      card.classList.add('complete');
    } else {
      card.classList.remove('complete');
    }
    updateCrearBtn();
  }
 
  // ─── Validation ──────────────────────────
  function updateCrearBtn() {
    const btn = document.getElementById('btn-crear');
    btn.disabled = !isFormComplete();
  }
 
  function isFormComplete() {
    // Section 1
    const nombre = document.getElementById('f-nombre').value.trim();
    const numPredios = parseInt(document.getElementById('f-num-predios').value) || 0;
    const codes = [...document.querySelectorAll('.predio-code')];
    if (!nombre || numPredios <= 0 || codes.length !== numPredios) return false;
    if (!codes.every(c => c.value.trim() !== '')) return false;
 
    // Section 2
    const areaTotal = document.getElementById('f-area-total').value.trim();
    const numLotes = parseInt(document.getElementById('f-num-lotes').value) || 0;
    if (!areaTotal || numLotes <= 0) return false;
 
    // All lotes complete
    const loteFields = document.querySelectorAll('.lote-field');
    if (loteFields.length !== numLotes * 4) return false;
    if (![...loteFields].every(f => f.value.trim() !== '')) return false;
 
    return true;
  }
 
  // ─── Create ───────────────────────────────
  function crearLugar() {
    if (!isFormComplete()) return;
 
    const nombre = document.getElementById('f-nombre').value.trim();
    const numLotes = parseInt(document.getElementById('f-num-lotes').value) || 0;
 
    // Determine zona based on first lote cultivo (simplified demo)
    const cultivos = [...document.querySelectorAll('.lote-card')].map(card => {
      const selects = card.querySelectorAll('select');
      return selects[1] ? selects[1].value : '';
    });
    const friaC = ['Papa','Maíz'];
    const zonaClass = friaC.includes(cultivos[0]) ? 'badge-fria' : 'badge-calida';
    const zonaLabel = friaC.includes(cultivos[0]) ? 'Fría' : 'Cálida';
 
    rowCount++;
    const tbody = document.getElementById('table-body');
    const row = document.createElement('tr');

    const dep = document.getElementById('f-departamento').value.trim();
    const mun = document.getElementById('f-municipio').value.trim();

    row.innerHTML = `
      <td>${rowCount}</td>
      <td>${nombre}</td>
      <td>${dep}</td>
      <td>${mun}</td>
      <td>
        <button class="action-btn action-edit" title="Editar">✏️</button>
        <button class="action-btn action-del"  title="Eliminar">🗑</button>
        <button class="action-btn action-eye"  title="Ver">👁</button>
      </td>
    `;
    // Animate new row
    row.style.animation = 'fadeIn .4s ease';
    tbody.appendChild(row);
 
    goToTable();
    showToast(`✔ Lugar "${nombre}" creado con ${numLotes} lote(s).`);
  }
 
  // ─── Toast ───────────────────────────────
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  // ─── MODAL AGENDAR CITA ─────────────────────────────────────

// Lista de lugares del usuario (en tu app real vendrá del backend)
const lugaresUsuario = [
  { id: 1, nombre: 'San Cristobal' },
  { id: 2, nombre: 'Abduzcan'      },
];

function initModalCita() {
  // Inyectar el modal en el body si aún no existe
  if (document.getElementById('modal-cita')) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'modal-cita';
  modal.innerHTML = `
    <div class="modal-box" style="position:relative;">
      <button class="modal-close" onclick="cerrarModalCita()">✕</button>
      <div class="modal-title">📅 Solicitar cita</div>
      <div class="modal-subtitle">Selecciona los lugares de producción para la inspección</div>

      <div id="lugares-list"></div>

      <div class="modal-success" id="modal-success">
        ✅ La cita ha sido solicitada con éxito.
      </div>

      <div class="modal-footer-custom">
        <button class="btn btn-secondary btn-sm" onclick="cerrarModalCita()">Cancelar</button>
        <button class="btn-solicitar" id="btn-solicitar" disabled onclick="solicitarCita()">
          Aceptar
        </button>
      </div>
    </div>
  `;

  // Cerrar al hacer clic fuera del box
  modal.addEventListener('click', function(e) {
    if (e.target === modal) cerrarModalCita();
  });

  document.body.appendChild(modal);
  renderLugares();
}

function renderLugares() {
  const container = document.getElementById('lugares-list');
  container.innerHTML = '';
  lugaresUsuario.forEach(lugar => {
    const div = document.createElement('div');
    div.className = 'lugar-option';
    div.dataset.id = lugar.id;
    div.innerHTML = `
      <div class="lugar-check">✓</div>
      <div class="lugar-info">
        <div class="lugar-id">Lugar #${lugar.id}</div>
        <div class="lugar-nombre">${lugar.nombre}</div>
      </div>
    `;
    div.addEventListener('click', () => toggleLugar(div));
    container.appendChild(div);
  });
}

function toggleLugar(el) {
  el.classList.toggle('selected');
  // Habilitar botón si hay al menos uno seleccionado
  const haySeleccion = document.querySelectorAll('.lugar-option.selected').length > 0;
  document.getElementById('btn-solicitar').disabled = !haySeleccion;
  // Ocultar mensaje de éxito si cambia la selección
  document.getElementById('modal-success').classList.remove('show');
}

function abrirModalCita() {
  initModalCita();
  // Limpiar estado anterior
  document.querySelectorAll('.lugar-option.selected').forEach(el => el.classList.remove('selected'));
  document.getElementById('btn-solicitar').disabled = true;
  document.getElementById('modal-success').classList.remove('show');
  // Mostrar
  requestAnimationFrame(() => {
    document.getElementById('modal-cita').classList.add('show');
  });
}

function cerrarModalCita() {
  document.getElementById('modal-cita').classList.remove('show');
}

function solicitarCita() {
  const seleccionados = [...document.querySelectorAll('.lugar-option.selected')]
    .map(el => el.dataset.id);

  if (seleccionados.length === 0) return;

  // Mostrar confirmación
  document.getElementById('modal-success').classList.add('show');
  document.getElementById('btn-solicitar').disabled = true;

  // Limpiar selección y cerrar después de 2 segundos
  setTimeout(() => {
    document.querySelectorAll('.lugar-option.selected')
      .forEach(el => el.classList.remove('selected'));
    cerrarModalCita();
  }, 2000);
}