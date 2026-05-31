/**
 * perfil.js — SIFEX
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. Sesión ────────────────────────────────────────────────────────────
    const usuarioString = localStorage.getItem('usuario');
    const token         = localStorage.getItem('token');
    const rol           = localStorage.getItem('rol');

    if (!usuarioString) { window.location.href = '../login.html'; return; }

    const usuario = JSON.parse(usuarioString);

    // ── 2. Selectores vista principal ────────────────────────────────────────
    const avatarImg     = document.getElementById('avatar-img');
    const cedulaHint    = document.getElementById('perfil-cedula');
    const nombreSidebar = document.getElementById('perfil-nombre');
    const rolSidebar    = document.getElementById('perfil-rol');
    const celularSpan   = document.getElementById('perfil-celular-val');
    const correoSpan    = document.getElementById('perfil-correo-val');
    const btnActualizar = document.getElementById('btn-actualizar');
    const topbarUser    = document.querySelector('.topbar-user');
    const btnSalir      = document.querySelector('.btn-salir');
    const toast         = document.getElementById('toast');

    // ── 3. Selectores modal ──────────────────────────────────────────────────
    const modal              = document.getElementById('modal-perfil');
    const modalCedula        = document.getElementById('modal-cedula');
    const modalRol           = document.getElementById('modal-rol');
    const modalPrimerNombre  = document.getElementById('modal-primer-nombre');
    const modalSegundoNombre = document.getElementById('modal-segundo-nombre');
    const modalPrimerApe     = document.getElementById('modal-primer-apellido');
    const modalSegundoApe    = document.getElementById('modal-segundo-apellido');
    const modalCelular       = document.getElementById('modal-celular');
    const modalCorreo        = document.getElementById('modal-correo');
    const modalPassword      = document.getElementById('modal-password');
    const modalBtnGuardar    = document.getElementById('modal-btn-guardar');
    const btnCerrarX         = document.getElementById('modal-btn-cerrar-x');
    const btnCancelar        = document.getElementById('modal-btn-cancelar');

    // ── 4. Poblar vista principal ────────────────────────────────────────────
    function _construirNombre(u) {
        return [u.Primer_nombre, u.Segundo_nombre, u.Primer_apellido, u.Segundo_apellido]
            .filter(Boolean).join(' ');
    }

    let nombreCompleto = _construirNombre(usuario);

    if (topbarUser)    topbarUser.textContent    = nombreCompleto;
    if (nombreSidebar) nombreSidebar.textContent = nombreCompleto;
    if (rolSidebar)    rolSidebar.textContent    = _formatearRol(rol);

    if (cedulaHint) {
        const tipo = usuario.Tipo_identificacion ?? 'C.C';
        cedulaHint.textContent = `${tipo}: ${usuario.Numero_identificacion ?? ''}`;
    }

    if (celularSpan) celularSpan.textContent = usuario.Celular ?? '—';
    if (correoSpan)  correoSpan.textContent  = usuario.Correo  ?? '—';

    if (avatarImg && usuario.Imagen) {
        avatarImg.src = usuario.Imagen.startsWith('http')
            ? usuario.Imagen
            : `${_baseUrl()}${usuario.Imagen}`;
        avatarImg.onerror = () => { avatarImg.src = '../../img/IMG-20230323-WA0019.jpg'; };
    }

    // ── 5. Botón Salir ───────────────────────────────────────────────────────
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
            localStorage.clear();
            alert('Sesión cerrada correctamente.');
            window.location.href = '../login.html';
        });
    }

    // ── 6. Abrir modal ───────────────────────────────────────────────────────
    if (btnActualizar) {
        btnActualizar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // Poblar campos
            if (modalCedula)        modalCedula.textContent        = cedulaHint?.textContent ?? '';
            if (modalRol)           modalRol.textContent           = _formatearRol(rol);
            if (modalPrimerNombre)  modalPrimerNombre.value        = usuario.Primer_nombre  ?? '';
            if (modalSegundoNombre) modalSegundoNombre.value       = usuario.Segundo_nombre ?? '';
            if (modalPrimerApe)     modalPrimerApe.value           = usuario.Primer_apellido  ?? '';
            if (modalSegundoApe)    modalSegundoApe.value          = usuario.Segundo_apellido ?? '';
            if (modalCelular)       modalCelular.value             = usuario.Celular ?? '';
            if (modalCorreo)        modalCorreo.value              = usuario.Correo  ?? '';
            if (modalPassword)      modalPassword.value            = '';
            _limpiarErrores();

            // setTimeout(0) saca la apertura del ciclo de evento actual,
            // impidiendo que Bootstrap procese el mismo click y cierre el modal
            setTimeout(() => {
                modal.style.display = 'flex';
                modal.classList.add('modal--visible');
                modalPrimerNombre?.focus();
            }, 0);
        });
    }

    // ── 7. Cerrar modal ──────────────────────────────────────────────────────
    btnCerrarX?.addEventListener('click',  _cerrarModal);
    btnCancelar?.addEventListener('click', _cerrarModal);

    // Backdrop: solo cierra si el click fue directo en el overlay (fuera del modal-box)
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) _cerrarModal();
    });

    // Evita que clics dentro del modal-box se propaguen al overlay
    modal?.querySelector('.modal-box')?.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.style.display === 'flex') _cerrarModal();
    });

    // ── 8. Guardar cambios ───────────────────────────────────────────────────
    if (modalBtnGuardar) {
        modalBtnGuardar.addEventListener('click', async () => {
            _limpiarErrores();

            const primerNombre  = modalPrimerNombre?.value.trim()  ?? '';
            const segundoNombre = modalSegundoNombre?.value.trim() ?? '';
            const primerApe     = modalPrimerApe?.value.trim()     ?? '';
            const segundoApe    = modalSegundoApe?.value.trim()    ?? '';
            const nuevoCelular  = modalCelular?.value.trim()       ?? '';
            const nuevoCorreo   = modalCorreo?.value.trim()        ?? '';
            const nuevaPassword = modalPassword?.value             ?? '';

            let hayError = false;
            if (!primerNombre) {
                document.getElementById('err-primer-nombre').textContent = 'El primer nombre es obligatorio.';
                hayError = true;
            }
            if (!primerApe) {
                document.getElementById('err-primer-apellido').textContent = 'El primer apellido es obligatorio.';
                hayError = true;
            }
            if (!nuevoCelular) {
                document.getElementById('err-celular').textContent = 'El celular es obligatorio.';
                hayError = true;
            }
            if (!nuevoCorreo || !nuevoCorreo.includes('@')) {
                document.getElementById('err-correo').textContent = 'Ingresa un correo válido.';
                hayError = true;
            }
            if (hayError) return;

            const id = _getId(usuario, rol);
            if (!id) { mostrarToast('No se encontró el ID del usuario.', 'error'); return; }

            const body = {
                Primer_nombre:    primerNombre,
                Segundo_nombre:   segundoNombre || null,
                Primer_apellido:  primerApe,
                Segundo_apellido: segundoApe   || null,
                Celular:          nuevoCelular,
                Correo:           nuevoCorreo,
            };
            if (nuevaPassword.trim() !== '') body.Password = nuevaPassword;

            const url     = _buildUrl(rol, id);
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            modalBtnGuardar.disabled    = true;
            modalBtnGuardar.textContent = 'Guardando…';

            try {
                const resp   = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
                const result = await resp.json();

                if (resp.ok) {
                    // Actualizar objeto local y localStorage
                    Object.assign(usuario, body);
                    delete usuario.Password; // no guardar contraseña en localStorage
                    localStorage.setItem('usuario', JSON.stringify(usuario));

                    // Refrescar vista principal
                    nombreCompleto = _construirNombre(usuario);
                    if (topbarUser)    topbarUser.textContent    = nombreCompleto;
                    if (nombreSidebar) nombreSidebar.textContent = nombreCompleto;
                    if (celularSpan)   celularSpan.textContent   = nuevoCelular;
                    if (correoSpan)    correoSpan.textContent    = nuevoCorreo;

                    _cerrarModal();
                    mostrarToast('Perfil actualizado correctamente ✓', 'success');
                } else {
                    mostrarToast('Error: ' + (result.message ?? 'No se pudo actualizar.'), 'error');
                }
            } catch (err) {
                console.error(err);
                mostrarToast('No se pudo conectar con el servidor.', 'error');
            } finally {
                modalBtnGuardar.disabled    = false;
                modalBtnGuardar.textContent = 'Guardar cambios';
            }
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    function _cerrarModal() {
        if (!modal) return;
        modal.classList.remove('modal--visible');
        modal.style.display = '';
    }

    function _limpiarErrores() {
        ['err-primer-nombre', 'err-primer-apellido', 'err-celular', 'err-correo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '';
        });
    }

    function _getId(u, r) {
        if (r === 'PRODUCTOR')   return u.Id_productor;
        if (r === 'FUNCIONARIO') return u.Id_funcionario;
        if (r === 'TECNICO')     return u.Id_tecnico;
        return u.id ?? u.Id ?? null;
    }

    function _baseUrl() {
        return rol === 'PRODUCTOR' ? 'http://localhost:8003' : 'http://localhost:9000';
    }

    function _buildUrl(r, id) {
        if (r === 'PRODUCTOR')   return `http://localhost:8003/productor/${id}`;
        if (r === 'FUNCIONARIO') return `http://localhost:9000/funcionario/${id}`;
        if (r === 'TECNICO')     return `http://localhost:9000/tecnico/${id}`;
        return `http://localhost:9000/usuario/${id}`;
    }

    function _formatearRol(r) {
        const mapa = { PRODUCTOR: 'Productor', FUNCIONARIO: 'Funcionario ICA', TECNICO: 'Técnico Oficial', ADMIN: 'Administrador' };
        return mapa[r] ?? r ?? '';
    }

    function mostrarToast(msg, tipo) {
        if (!toast) return;
        toast.textContent = msg;
        toast.className   = `toast toast--${tipo} toast--visible`;
        setTimeout(() => toast.classList.remove('toast--visible'), 3500);
    }

});