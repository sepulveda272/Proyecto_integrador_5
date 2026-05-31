import getConnection from "../database/conection.js";
import multer from "multer";
import path from "path";
import fs from "fs";

/* ══════════════════════════════════════════════════════════
   MULTER — subida de imágenes de cultivos
   Carpeta: uploads/cultivos/
   Campo esperado en form-data: "Imagen"
══════════════════════════════════════════════════════════ */
const UPLOAD_DIR_CULTIVO = "uploads/cultivos";
if (!fs.existsSync(UPLOAD_DIR_CULTIVO)) fs.mkdirSync(UPLOAD_DIR_CULTIVO, { recursive: true });

const storageCultivo = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR_CULTIVO),
    filename:    (_req, file, cb) => {
        const ext    = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, unique);
    }
});

const fileFilterCultivo = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error("Formato no permitido. Use JPG, PNG, WEBP o GIF."), false);
};

export const uploadCultivoImg = multer({
    storage:    storageCultivo,
    fileFilter: fileFilterCultivo,
    limits:     { fileSize: 5 * 1024 * 1024 } // 5 MB
}).single("Imagen");


/* ══════════════════════════════════════════════════════════
   CRUD CULTIVOS
══════════════════════════════════════════════════════════ */

export const getCultivos = async (req, res) => {
    try {
        const connection = await getConnection();
        const cultivos   = await connection.query("SELECT * FROM cultivo ORDER BY Id_cultivo ASC");

        for (const c of cultivos) {
            c.plagas = await connection.query(`
                SELECT p.Id_plaga, p.Nombre_cientifico, p.Nombre_comun, p.Imagen
                FROM plagas p
                INNER JOIN afectado a ON p.Id_plaga = a.Id_plaga
                WHERE a.Id_cultivo = ?
            `, [c.Id_cultivo]);
        }

        res.json({
            status: "Success",
            message: "Listado de cultivos obtenido correctamente",
            total_results: cultivos.length,
            data: cultivos
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const getCultivo = async (req, res) => {
    try {
        const { id }     = req.params;
        const connection = await getConnection();
        const [cultivo]  = await connection.query("SELECT * FROM cultivo WHERE Id_cultivo = ?", [id]);

        if (!cultivo) return res.status(404).json({ status: "Error", message: `Cultivo ${id} no encontrado.` });

        cultivo.plagas = await connection.query(`
            SELECT p.Id_plaga, p.Nombre_cientifico, p.Nombre_comun, p.Imagen
            FROM plagas p INNER JOIN afectado a ON p.Id_plaga = a.Id_plaga
            WHERE a.Id_cultivo = ?
        `, [id]);

        res.json({ status: "Success", data: cultivo });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const addCultivo = async (req, res) => {
    try {
        const { Nombre_especie, Variedad, Descripcion, Id_plagas } = req.body;

        if (!Nombre_especie || !Variedad) {
            return res.status(400).json({ status: "Error", message: "Nombre de especie y variedad son requeridos." });
        }

        // Prioridad: archivo subido → URL en body → null
        const Imagen = req.file
            ? `/${UPLOAD_DIR_CULTIVO}/${req.file.filename}`
            : (req.body.Imagen ?? null);

        if (!Imagen) {
            return res.status(400).json({ status: "Error", message: "Debes subir una imagen o indicar una URL." });
        }

        const connection = await getConnection();
        const result     = await connection.query(
            "INSERT INTO cultivo (Nombre_especie, Variedad, Imagen, Descripcion) VALUES (?, ?, ?, ?)",
            [Nombre_especie, Variedad, Imagen, Descripcion || null]
        );

        const idCultivo = result.insertId;

        // Relacionar con plagas
        const plagas = _parseIds(Id_plagas);
        for (const idPlaga of plagas) {
            await connection.query("INSERT INTO afectado (Id_cultivo, Id_plaga) VALUES (?, ?)", [idCultivo, idPlaga]);
        }

        res.status(201).json({
            status: "Success",
            message: `El cultivo "${Nombre_especie}" se guardó correctamente.`,
            data: { Id_cultivo: idCultivo, Nombre_especie, Variedad, Imagen, Descripcion }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const updateCultivo = async (req, res) => {
    try {
        const { id }                                           = req.params;
        const { Nombre_especie, Variedad, Descripcion, Id_plagas } = req.body;
        const connection = await getConnection();

        // Si se sube nueva imagen, usar la nueva; si no, conservar la existente
        // Si el usuario sube un archivo nuevo, usarlo; si manda texto (URL), usarlo;
        // si no manda nada, conservar la imagen existente en la BD
        let Imagen = null;
        if (req.file) {
            // Borrar imagen anterior del disco antes de reemplazarla
            const [actual] = await connection.query("SELECT Imagen FROM cultivo WHERE Id_cultivo = ?", [id]);
            if (actual?.Imagen && actual.Imagen.startsWith("/uploads/") && fs.existsSync(`.${actual.Imagen}`)) {
                fs.unlinkSync(`.${actual.Imagen}`);
            }
            Imagen = `/${UPLOAD_DIR_CULTIVO}/${req.file.filename}`;
        } else if (req.body.Imagen) {
            // URL externa enviada como texto
            Imagen = req.body.Imagen;
        } else {
            // No se envió imagen nueva → conservar la existente en la BD
            const [actual] = await connection.query("SELECT Imagen FROM cultivo WHERE Id_cultivo = ?", [id]);
            Imagen = actual?.Imagen ?? null;
        }

        const result = await connection.query(
            "UPDATE cultivo SET Nombre_especie=?, Variedad=?, Imagen=?, Descripcion=? WHERE Id_cultivo=?",
            [Nombre_especie, Variedad, Imagen, Descripcion || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: `Cultivo ${id} no encontrado.` });
        }

        if (Id_plagas !== undefined) {
            await connection.query("DELETE FROM afectado WHERE Id_cultivo = ?", [id]);
            for (const idPlaga of _parseIds(Id_plagas)) {
                await connection.query("INSERT INTO afectado (Id_cultivo, Id_plaga) VALUES (?, ?)", [id, idPlaga]);
            }
        }

        res.json({ status: "Success", message: `El cultivo "${Nombre_especie}" (ID: ${id}) se actualizó.` });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const deleteCultivo = async (req, res) => {
    try {
        const { id }     = req.params;
        const connection = await getConnection();

        // Borrar imagen del disco si existe
        const [cultivo] = await connection.query("SELECT Imagen FROM cultivo WHERE Id_cultivo = ?", [id]);
        if (cultivo?.Imagen && cultivo.Imagen.startsWith("/uploads/") && fs.existsSync(`.${cultivo.Imagen}`)) {
            fs.unlinkSync(`.${cultivo.Imagen}`);
        }

        await connection.query("DELETE FROM afectado WHERE Id_cultivo = ?", [id]);
        const result = await connection.query("DELETE FROM cultivo WHERE Id_cultivo = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: `Cultivo ${id} no existe.` });
        }

        res.json({ status: "Success", message: `Cultivo ${id} eliminado correctamente.` });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const getPlagasPorCultivo = async (req, res) => {
    try {
        const { id }     = req.params;
        const connection = await getConnection();
        const plagas     = await connection.query(`
            SELECT p.* FROM plagas p
            INNER JOIN afectado a ON p.Id_plaga = a.Id_plaga
            WHERE a.Id_cultivo = ?
        `, [id]);
        res.json({ status: "Success", total_results: plagas.length, data: plagas });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

// Helper: acepta string JSON, array o número suelto
function _parseIds(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(Number);
    try { const p = JSON.parse(val); return Array.isArray(p) ? p.map(Number) : [Number(p)]; }
    catch { return [Number(val)].filter(Boolean); }
}