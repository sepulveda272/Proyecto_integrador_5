import { Router } from "express";
import { getProductores, addProductor, getProductor, deleteProductor, updateProductor, uploadProductorImg } from "../controllers/productor.controllers.js";
import multer from "multer";

const routes = Router();

function subirImagenProductor(req, res, next) {
    uploadProductorImg(req, res, (err) => {
        if (!err) return next(); // sin error → continuar normal

        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                status: "Error",
                message: "La imagen supera el tamaño máximo permitido de 2 MB."
            });
        }

        // Cualquier otro error de multer (formato no permitido, etc.)
        return res.status(400).json({
            status: "Error",
            message: err.message ?? "Error al procesar la imagen."
        });
    });
}

routes.get("/", getProductores);
routes.post("/add",        subirImagenProductor, addProductor);
routes.get("/:id",         getProductor);
routes.put("/delete/:id",  deleteProductor);
routes.put("/:id",         subirImagenProductor, updateProductor);

export default routes;