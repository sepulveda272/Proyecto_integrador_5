const loginButton = document.querySelector('button');
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');

loginButton.addEventListener('click', async (e) => {
    e.preventDefault(); // Muy importante para evitar recargas inesperadas

    // Asegúrate de usar los nombres EXACTOS que espera tu controlador: Correo y Password
    const datosParaBackend = {
        Correo: emailInput.value,    // Con 'C' mayúscula
        Password: passwordInput.value // Con 'P' mayúscula
    };

    if (!datosParaBackend.Correo || !datosParaBackend.Password) {
        return alert("Por favor, completa los datos.");
    }

    try {
        const response = await fetch('http://localhost:8003/login/logeate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosParaBackend)
        });

        const result = await response.json();
        console.log("Respuesta completa del servidor:", result); // PASO 1: Ver si llega el objeto

        if (response.ok) {
            // Guardar Token
            if (result.data && result.data.token) {
                localStorage.setItem('token', result.data.token);
                console.log("Token guardado correctamente");
            }

            // Guardar Usuario
            if (result.data && result.data.user) {
                const userString = JSON.stringify(result.data.user);
                localStorage.setItem('usuario', userString);
                console.log("Usuario guardado en localStorage:", userString);
            } else {
                console.error("No se encontró result.data.user en la respuesta");
            }

            alert(result.message);
            window.location.href = "./productor/inicio.html"; 
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Error al conectar:", error);
        alert("No se pudo conectar con el servidor SIFEX.");
    }
});