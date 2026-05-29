import { Router } from "express";
import { getTecnicos, getTecnico, addTecnico, updateTecnico, deleteTecnico, uploadTecnicoImg } from "../controllers/tecnico.controllers.js";
import multer from "multer";

const routes = Router();

function subirImagenTecnico(req, res, next) {
    uploadTecnicoImg(req, res, (err) => {
        if (!err) return next();

        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                status: "Error",
                message: "La imagen supera el tamaño máximo permitido de 2 MB."
            });
        }

        return res.status(400).json({
            status: "Error",
            message: err.message ?? "Error al procesar la imagen."
        });
    });
}

routes.get("/",            getTecnicos);
routes.post("/add",        subirImagenTecnico, addTecnico);
routes.get("/:id",         getTecnico);
routes.put("/:id",         subirImagenTecnico, updateTecnico);
routes.put("/delete/:id",  deleteTecnico);

export default routes;