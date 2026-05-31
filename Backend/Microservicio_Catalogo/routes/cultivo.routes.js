import { Router } from "express";
import multer from "multer";
import {
    getCultivos, getCultivo, addCultivo, updateCultivo,
    deleteCultivo, getPlagasPorCultivo, uploadCultivoImg
} from "../controllers/cultivo.controllers.js";

const routes = Router();

function subirImagenCultivo(req, res, next) {
    uploadCultivoImg(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ status: "Error", message: "La imagen supera el límite de 5 MB." });
        }
        return res.status(400).json({ status: "Error", message: err.message ?? "Error al procesar la imagen." });
    });
}

routes.get("/",                  getCultivos);
routes.post("/add",              subirImagenCultivo, addCultivo);
routes.get("/:id/plagas",        getPlagasPorCultivo);
routes.get("/:id",               getCultivo);
routes.put("/:id",               subirImagenCultivo, updateCultivo);
routes.delete("/:id",            deleteCultivo);

export default routes;