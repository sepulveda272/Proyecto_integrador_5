document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleccionar los elementos del DOM
    const nombreUsuarioTopbar = document.querySelector('.topbar-user');
    const btnSalir = document.querySelector('.btn-salir');

    // 2. Obtener y mostrar los datos del usuario logeado
    const usuarioString = localStorage.getItem('usuario');
    
    if (usuarioString) {
        const usuarioData = JSON.parse(usuarioString);
        
        // Construimos el nombre completo basado en los campos que devuelve tu back
        // Puedes usar solo Primer_nombre o combinar con los apellidos
        const nombreCompleto = `${usuarioData.Primer_nombre} ${usuarioData.Primer_apellido}`;
        
        if (nombreUsuarioTopbar) {
            nombreUsuarioTopbar.textContent = nombreCompleto;
        }
    } else {
        // Opcional: Si no hay usuario en localStorage, significa que no está logeado
        // Podrías redirigirlo al login por seguridad
        window.location.href = "../login.html"; 
    }

    // 3. Configurar el botón de Salir
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
            // Borra todo el localStorage (Token y Usuario)
            localStorage.clear();
            
            // También puedes borrar cookies si es necesario, 
            // aunque el clear de arriba limpia lo que guardamos nosotros.
            
            alert("Sesión cerrada correctamente.");
            
            // Redirigir al login
            window.location.href = "../login.html"; // Ajusta la ruta a tu archivo de login
        });
    }
});