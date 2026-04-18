import getConnection from "../database/conection.js";
import bcryptjs from "bcryptjs";
import generateJWT from "../helpers/generate.JWT.js";

export const login = async (req, res) => {
    try {
        const { Correo, Password } = req.body;

        const connection = await getConnection();

        // 1. Buscar al usuario por correo en MySQL
        const result = await connection.query(
            "SELECT * FROM productor WHERE Correo = ?", 
            [Correo]
        );

        // MySQL devuelve un array. Si está vacío, el usuario no existe.
        if (result.length === 0) {
            return res.status(400).json({
                status: "Error",
                message: "Usuario no encontrado"
            });
        }

        const user = result[0];

        // 2. Verificar si el usuario está Inactivo (Soft Delete que hicimos antes)
        if (user.Estado === 'Inactivo' || user.Estado === 'Pendiente') {
            return res.status(403).json({
                status: "Error",
                message: "Esta cuenta ha sido desactivada. Contacte al administrador."
            });
        }

        // 3. Comparar la contraseña ingresada con el Hash de la BD
        const validPassword = await bcryptjs.compare(Password, user.Password);
        if (!validPassword) {
            return res.status(400).json({
                status: "Error",
                message: "Contraseña incorrecta"
            });
        }

        // 4. Generar el Token JWT
        // En MySQL solemos usar 'Id_productor' en lugar de '_id'
        const token = await generateJWT(user.Id_productor);

        // 5. Guardar token en una Cookie (opcional según tu estrategia)
        res.cookie("token", token, {
            httpOnly: true, // Más seguro contra ataques XSS
            secure: process.env.NODE_ENV === 'production'
        });

        // 6. Limpiar datos sensibles antes de enviar la respuesta
        const userSafe = { ...user };
        delete userSafe.Password;

        res.json({
            status: "Success",
            message: `Bienvenido(a) ${user.Primer_nombre}`,
            data: {
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
}