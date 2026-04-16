const isAdminRole = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            msg: 'Se quiere verificar el rol sin validar el token primero'
        });
    }

    // Como ya inyectamos el rol en el middleware anterior:
    const { rol, Primer_nombre, Primer_apellido } = req.user;

    if (rol !== 'ADMIN') {
        return res.status(401).json({
            msg: `${Primer_nombre} ${Primer_apellido} no es Administrador - Acceso denegado`
        });
    }

    next();
}