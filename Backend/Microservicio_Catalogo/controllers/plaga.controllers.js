import getConnection from "../database/conection.js";
import multer from "multer";
import path from "path";
import fs from "fs";

/* ══════════════════════════════════════════════════════════
   MULTER — subida de imágenes de plagas
   Carpeta: uploads/plagas/
   Campo esperado en form-data: "Imagen"
══════════════════════════════════════════════════════════ */
const UPLOAD_DIR_PLAGA = "uploads/plagas";
if (!fs.existsSync(UPLOAD_DIR_PLAGA)) fs.mkdirSync(UPLOAD_DIR_PLAGA, { recursive: true });

const storagePlaga = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR_PLAGA),
    filename:    (_req, file, cb) => {
        const ext    = path.extname(file.originalname).toLowerCase();
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        cb(null, unique);
    }
});

const fileFilterPlaga = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error("Formato no permitido. Use JPG, PNG, WEBP o GIF."), false);
};

export const uploadPlagaImg = multer({
    storage:    storagePlaga,
    fileFilter: fileFilterPlaga,
    limits:     { fileSize: 5 * 1024 * 1024 } // 5 MB
}).single("Imagen");


/* ══════════════════════════════════════════════════════════
   CRUD PLAGAS
══════════════════════════════════════════════════════════ */

export const getPlagas = async (req, res) => {
    try {
        const connection = await getConnection();
        const plagas     = await connection.query("SELECT * FROM plagas ORDER BY Id_plaga ASC");

        for (const p of plagas) {
            p.cultivos = await connection.query(`
                SELECT c.Id_cultivo, c.Nombre_especie, c.Variedad
                FROM cultivo c INNER JOIN afectado a ON c.Id_cultivo = a.Id_cultivo
                WHERE a.Id_plaga = ?
            `, [p.Id_plaga]);
        }

        res.json({ status: "Success", total_results: plagas.length, data: plagas });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const getPlaga = async (req, res) => {
    try {
        const { id }    = req.params;
        const connection = await getConnection();
        const [plaga]   = await connection.query("SELECT * FROM plagas WHERE Id_plaga = ?", [id]);

        if (!plaga) return res.status(404).json({ status: "Error", message: `Plaga ${id} no encontrada.` });

        plaga.cultivos = await connection.query(`
            SELECT c.Id_cultivo, c.Nombre_especie, c.Variedad
            FROM cultivo c INNER JOIN afectado a ON c.Id_cultivo = a.Id_cultivo
            WHERE a.Id_plaga = ?
        `, [id]);

        res.json({ status: "Success", data: plaga });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const addPlaga = async (req, res) => {
    try {
        const { Nombre_cientifico, Nombre_comun, Descripcion, Id_cultivos } = req.body;

        if (!Nombre_cientifico || !Nombre_comun) {
            return res.status(400).json({ status: "Error", message: "Nombre científico y nombre común son requeridos." });
        }

        const Imagen = req.file
            ? `/${UPLOAD_DIR_PLAGA}/${req.file.filename}`
            : (req.body.Imagen ?? null);

        if (!Imagen) {
            return res.status(400).json({ status: "Error", message: "Debes subir una imagen o indicar una URL." });
        }

        const connection = await getConnection();
        const result     = await connection.query(
            "INSERT INTO plagas (Nombre_cientifico, Nombre_comun, Imagen, Descripcion) VALUES (?, ?, ?, ?)",
            [Nombre_cientifico, Nombre_comun, Imagen, Descripcion || null]
        );

        const idPlaga = result.insertId;

        const cultivos = _parseIds(Id_cultivos);
        for (const idCultivo of cultivos) {
            await connection.query("INSERT INTO afectado (Id_cultivo, Id_plaga) VALUES (?, ?)", [idCultivo, idPlaga]);
        }

        res.status(201).json({
            status: "Success",
            message: `La plaga "${Nombre_comun}" se guardó correctamente.`,
            data: { Id_plaga: idPlaga, Nombre_cientifico, Nombre_comun, Imagen, Descripcion }
        });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const updatePlaga = async (req, res) => {
    try {
        const { id }                                                    = req.params;
        const { Nombre_cientifico, Nombre_comun, Descripcion, Id_cultivos } = req.body;
        const connection = await getConnection();

        // Si el usuario sube un archivo nuevo, usarlo; si manda texto (URL), usarlo;
        // si no manda nada, conservar la imagen existente en la BD
        let Imagen = null;
        if (req.file) {
            // Borrar imagen anterior del disco antes de reemplazarla
            const [actual] = await connection.query("SELECT Imagen FROM plagas WHERE Id_plaga = ?", [id]);
            if (actual?.Imagen && actual.Imagen.startsWith("/uploads/") && fs.existsSync(`.${actual.Imagen}`)) {
                fs.unlinkSync(`.${actual.Imagen}`);
            }
            Imagen = `/${UPLOAD_DIR_PLAGA}/${req.file.filename}`;
        } else if (req.body.Imagen) {
            // URL externa enviada como texto
            Imagen = req.body.Imagen;
        } else {
            // No se envió imagen nueva → conservar la existente en la BD
            const [actual] = await connection.query("SELECT Imagen FROM plagas WHERE Id_plaga = ?", [id]);
            Imagen = actual?.Imagen ?? null;
        }

        const result = await connection.query(
            "UPDATE plagas SET Nombre_cientifico=?, Nombre_comun=?, Imagen=?, Descripcion=? WHERE Id_plaga=?",
            [Nombre_cientifico, Nombre_comun, Imagen, Descripcion || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: `Plaga ${id} no encontrada.` });
        }

        if (Id_cultivos !== undefined) {
            await connection.query("DELETE FROM afectado WHERE Id_plaga = ?", [id]);
            for (const idCultivo of _parseIds(Id_cultivos)) {
                await connection.query("INSERT INTO afectado (Id_cultivo, Id_plaga) VALUES (?, ?)", [idCultivo, id]);
            }
        }

        res.json({ status: "Success", message: `La plaga "${Nombre_comun}" (ID: ${id}) se actualizó.` });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

export const deletePlaga = async (req, res) => {
    try {
        const { id }     = req.params;
        const connection = await getConnection();

        const [plaga] = await connection.query("SELECT Imagen FROM plagas WHERE Id_plaga = ?", [id]);
        if (plaga?.Imagen && plaga.Imagen.startsWith("/uploads/") && fs.existsSync(`.${plaga.Imagen}`)) {
            fs.unlinkSync(`.${plaga.Imagen}`);
        }

        await connection.query("DELETE FROM afectado WHERE Id_plaga = ?", [id]);
        const result = await connection.query("DELETE FROM plagas WHERE Id_plaga = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "Error", message: `Plaga ${id} no existe.` });
        }

        res.json({ status: "Success", message: `Plaga ${id} eliminada correctamente.` });
    } catch (error) {
        res.status(500).json({ status: "Error", message: error.message });
    }
};

function _parseIds(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(Number);
    try { const p = JSON.parse(val); return Array.isArray(p) ? p.map(Number) : [Number(p)]; }
    catch { return [Number(val)].filter(Boolean); }
}