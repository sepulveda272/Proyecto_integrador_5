export const isFuncionarioRole = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            msg: 'Se quiere verificar el rol sin validar el token primero'
        });
    }

    const { rol, Primer_nombre, Primer_apellido } = req.user;

    if (rol !== 'FUNCIONARIO') {
        return res.status(401).json({
            msg: `${Primer_nombre} ${Primer_apellido} no es Funcionario ICA - Acceso denegado`
        });
    }

    next();
};

export const isTecnicoRole = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            msg: 'Se quiere verificar el rol sin validar el token primero'
        });
    }

    const { rol, Primer_nombre, Primer_apellido } = req.user;

    if (rol !== 'TECNICO') {
        return res.status(401).json({
            msg: `${Primer_nombre} ${Primer_apellido} no es Técnico Oficial - Acceso denegado`
        });
    }

    next();
};

// Permite acceso si el usuario tiene cualquiera de los dos roles
export const isTecnicoOrFuncionario = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            msg: 'Se quiere verificar el rol sin validar el token primero'
        });
    }

    const { rol, Primer_nombre, Primer_apellido } = req.user;

    if (rol !== 'TECNICO' && rol !== 'FUNCIONARIO') {
        return res.status(401).json({
            msg: `${Primer_nombre} ${Primer_apellido} no tiene permisos para esta acción`
        });
    }

    next();
};