import { Router } from "express";
import multer from "multer";
import {
    getPlagas, getPlaga, addPlaga, updatePlaga,
    deletePlaga, uploadPlagaImg
} from "../controllers/plaga.controllers.js";

const routes = Router();

function subirImagenPlaga(req, res, next) {
    uploadPlagaImg(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ status: "Error", message: "La imagen supera el límite de 5 MB." });
        }
        return res.status(400).json({ status: "Error", message: err.message ?? "Error al procesar la imagen." });
    });
}

routes.get("/",        getPlagas);
routes.post("/add",    subirImagenPlaga, addPlaga);
routes.get("/:id",     getPlaga);
routes.put("/:id",     subirImagenPlaga, updatePlaga);
routes.delete("/:id",  deletePlaga);

export default routes;