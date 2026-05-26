const loginButton   = document.querySelector('button');
const emailInput    = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');

loginButton.addEventListener('click', async (e) => {
    e.preventDefault();

    const datos = {
        Correo:   emailInput.value,
        Password: passwordInput.value
    };

    if (!datos.Correo || !datos.Password) {
        return alert("Por favor, completa los datos.");
    }

    try {
        // 1. Intentar en microservicio de inspecciones (técnico / funcionario ICA)
        const respInsp   = await fetch('http://localhost:9000/login/logeate', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(datos)
        });
        const resultInsp = await respInsp.json();

        if (respInsp.ok) {
            _guardarYRedirigir(resultInsp);
            return;
        }

        // Si el usuario no existe en inspecciones, intentar en infraestructura (productor)
        if (resultInsp.message?.toLowerCase().includes('no encontrado')) {
            const respInfra   = await fetch('http://localhost:8003/login/logeate', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(datos)
            });
            const resultInfra = await respInfra.json();

            if (respInfra.ok) {
                // El microservicio de infraestructura no devuelve rol; lo asignamos aquí
                resultInfra.data.rol = 'PRODUCTOR';
                _guardarYRedirigir(resultInfra);
                return;
            }

            alert("Error: " + resultInfra.message);
            return;
        }

        // Cualquier otro error de inspecciones (contraseña incorrecta, cuenta inactiva, etc.)
        alert("Error: " + resultInsp.message);

    } catch (error) {
        console.error("Error al conectar:", error);
        alert("No se pudo conectar con el servidor SIFEX.");
    }
});

function _guardarYRedirigir(result) {
    if (result.data?.token)  localStorage.setItem('token',   result.data.token);
    if (result.data?.user)   localStorage.setItem('usuario', JSON.stringify(result.data.user));
    if (result.data?.rol)    localStorage.setItem('rol',     result.data.rol);

    alert(result.message);

    const rol = result.data?.rol;
    if      (rol === 'TECNICO')      window.location.href = './tecnico/inspeccion.html';
    else if (rol === 'FUNCIONARIO')  window.location.href = './funcionarioICA/solicitudes.html';
    else                             window.location.href = './productor/lugarProducción.html';
}
