import getConnection from "../database/conection.js";
import bcryptjs from "bcryptjs";
import generateJWT from "../helpers/generate.JWT.js";

export const login = async (req, res) => {
    try {
        const { Correo, Password } = req.body;

        const connection = await getConnection();

        // Buscar en tecnico_oficial primero, luego en funcionario_ica
        const fuentes = [
            { tabla: "tecnico_oficial", idCol: "Id_tecnico", rol: "TECNICO" },
            { tabla: "funcionario_ica",  idCol: "Id_funcionario", rol: "FUNCIONARIO" }
        ];

        let user = null;
        let rol  = null;
        let idCol = null;

        for (const fuente of fuentes) {
            const rows = await connection.query(
                `SELECT * FROM ${fuente.tabla} WHERE Correo = ?`, [Correo]
            );
            if (rows.length > 0) {
                user  = rows[0];
                rol   = fuente.rol;
                idCol = fuente.idCol;
                break;
            }
        }

        if (!user) {
            return res.status(400).json({
                status: "Error",
                message: "Usuario no encontrado"
            });
        }

        // Verificar estado de la cuenta
        if (user.Estado === "Inactivo" || user.Estado === "Pendiente") {
            return res.status(403).json({
                status: "Error",
                message: "Esta cuenta está desactivada. Contacte al administrador."
            });
        }

        // Verificar contraseña
        const validPassword = await bcryptjs.compare(Password, user.Password);
        if (!validPassword) {
            return res.status(400).json({
                status: "Error",
                message: "Contraseña incorrecta"
            });
        }

        // Generar JWT con el ID del usuario
        const token = await generateJWT(user[idCol]);

        // Guardar token en cookie HTTP-only
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        });

        // Respuesta sin contraseña
        const userSafe = { ...user };
        delete userSafe.Password;

        res.json({
            status: "Success",
            message: `Bienvenido(a) ${user.Primer_nombre}`,
            data: {
                rol,
                user: userSafe,
                token
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "Error",
            message: "Error interno, contacte al servicio técnico"
        });
    }
};
