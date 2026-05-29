import getConnection from "../database/conection.js";
import bcryptjs from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

/* ══════════════════════════════════════════════════════════
   CONFIGURACIÓN DE MULTER — subida de imágenes de productor
   Las imágenes se guardan en:  uploads/productores/
   El campo esperado en el form-data es: "Imagen"
══════════════════════════════════════════════════════════ */

// Crear la carpeta si no existe al arrancar el módulo
const UPLOAD_DIR = "uploads/productores";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req, file, cb) => {
        // Nombre único: timestamp + random + extensión original
        const ext    = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, unique);
    }
});

const fileFilter = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Formato de imagen no permitido. Use JPG, PNG o WEBP."), false);
    }
};

// Exportamos el middleware para usarlo en las rutas
export const uploadProductorImg = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
}).single("Imagen");


export const getProductores = async (req, res) => {
    try {
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM productor");

        res.json({
            status: "Success",
            message: "Listado de productores obtenido correctamente",
            total_results: result.length,
            data: result
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
}

export const addProductor = async (req, res) => {
    try {
        const {
            Numero_identificacion, Tipo_identificacion, Primer_nombre, Segundo_nombre,
            Primer_apellido, Segundo_apellido, Celular, Correo, Password
        } = req.body;

        // Si se subió un archivo, usar su ruta; si no, usar URL enviada en el body
        const Imagen = req.file
            ? `/${UPLOAD_DIR}/${req.file.filename}`
            : (req.body.Imagen ?? null);

        const salt = await bcryptjs.genSalt(10);
        const hashedEmailPassword = await bcryptjs.hash(Password, salt);

        const productor = {
            Numero_identificacion,
            Tipo_identificacion,
            Primer_nombre,
            Segundo_nombre,
            Primer_apellido,
            Segundo_apellido,
            Imagen,
            Celular,
            Correo,
            Password: hashedEmailPassword,
            Estado: "Inactivo"
        };

        const connection = await getConnection();
        const result = await connection.query("INSERT INTO productor SET ?", productor);

        const respuestaDatos = { ...productor };
        delete respuestaDatos.Password;

        res.status(201).json({
            status: "Success",
            message: `El productor "${Primer_nombre}" se guardó correctamente.`,
            data: {
                id: result.insertId,
                ...respuestaDatos
            }
        });

    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "No se pudo guardar el productor",
            error: error.message
        });
    }
}

export const getProductor = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();
        const result = await connection.query("SELECT * FROM productor WHERE Id_productor = ?", id);
        res.json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

export const deleteProductor = async (req, res) => {
    try {
        const { id } = req.params;
        const connection = await getConnection();

        const result = await connection.query(
            "UPDATE productor SET Estado = 'Inactivo' WHERE Id_productor = ?",
            id
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `No se pudo desactivar: El productor con ID ${id} no existe.`
            });
        }

        res.json({
            status: "Success",
            message: `El productor con ID ${id} ha sido marcado como Inactivo correctamente.`
        });

    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "Error al intentar cambiar el estado del productor",
            details: error.message
        });
    }
}

export const updateProductor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            Numero_identificacion, Tipo_identificacion, Primer_nombre,
            Segundo_nombre, Primer_apellido, Segundo_apellido,
            Celular, Correo, Password, Estado
        } = req.body;

        // Si llegó un archivo nuevo, usar su ruta; si no, mantener lo que venga en body
        const Imagen = req.file
            ? `/${UPLOAD_DIR}/${req.file.filename}`
            : (req.body.Imagen ?? undefined);

        const datosAActualizar = {
            Numero_identificacion, Tipo_identificacion, Primer_nombre,
            Segundo_nombre, Primer_apellido, Segundo_apellido,
            Celular, Correo, Estado
        };

        // Solo incluir Imagen si se recibió algún valor (archivo o URL)
        if (Imagen !== undefined) datosAActualizar.Imagen = Imagen;

        if (Password && Password.trim() !== "") {
            const salt = await bcryptjs.genSalt(10);
            datosAActualizar.Password = await bcryptjs.hash(Password, salt);
        }

        const connection = await getConnection();
        const result = await connection.query(
            "UPDATE productor SET ? WHERE Id_productor = ?",
            [datosAActualizar, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "Error",
                message: `No se pudo actualizar: El productor con ID ${id} no existe.`
            });
        }

        const respuestaSafe = { ...datosAActualizar };
        delete respuestaSafe.Password;

        res.json({
            status: "Success",
            message: `El productor "${Primer_nombre}" se actualizó correctamente.`,
            data: { id, ...respuestaSafe }
        });

    } catch (error) {
        res.status(500).json({
            status: "Error",
            message: "Error al actualizar el productor",
            details: error.message
        });
    }
}