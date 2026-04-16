import { response, request } from 'express';
import jwt from 'jsonwebtoken';
import getConnection from "../database/conection.js";

const validateJWT = async (req = request, res = response, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ msg: 'No hay token en la petición' });
    }

    try {
        const { id } = jwt.verify(token, process.env.SECRET_OR_PRIVATE_KEY);
        const db = await getConnection();

        // Definimos las tablas y el nombre de su columna ID según tus imágenes
        const tablas = [
            { nombre: 'Admin', idCol: 'Id_admin', rol: 'ADMIN' },
            { nombre: 'Funcionario_ICA', idCol: 'Id_funcionario', rol: 'FUNCIONARIO' },
            { nombre: 'Tecnico_oficial', idCol: 'Id_tecnico', rol: 'TECNICO' },
            { nombre: 'Productor', idCol: 'Id_productor', rol: 'PRODUCTOR' }
        ];

        let usuarioEncontrado = null;

        // Buscamos en cada tabla
        for (const tabla of tablas) {
            const rows = await db.query(
                `SELECT * FROM ${tabla.nombre} WHERE ${tabla.idCol} = ?`, 
                [id]
            );

            if (rows.length > 0) {
                usuarioEncontrado = rows[0];
                usuarioEncontrado.rol = tabla.rol; // Le asignamos el rol dinámicamente
                break; // Si lo encuentra, deja de buscar en las demás tablas
            }
        }

        if (!usuarioEncontrado) {
            return res.status(401).json({
                msg: 'Token no válido - usuario no existe en ninguna tabla'
            });
        }

        // Verificar si el usuario está activo (campo Estado en tus imágenes)
        if (usuarioEncontrado.Estado === 0) {
            return res.status(401).json({
                msg: 'Token no válido - usuario con estado inactivo'
            });
        }

        req.user = usuarioEncontrado;
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({ msg: 'Token no válido' });
    }
}

export { validateJWT };