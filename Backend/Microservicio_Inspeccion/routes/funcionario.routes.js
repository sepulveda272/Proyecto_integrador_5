import { Router } from "express";
import { getFuncionarios, getFuncionario, addFuncionario, updateFuncionario, deleteFuncionario, uploadFuncionarioImg } from "../controllers/funcionario.controllers.js";
import multer from "multer";

const routes = Router();

function subirImagenFuncionario(req, res, next) {
    uploadFuncionarioImg(req, res, (err) => {
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

routes.get("/",            getFuncionarios);
routes.post("/add",        subirImagenFuncionario, addFuncionario);
routes.get("/:id",         getFuncionario);
routes.put("/:id",         subirImagenFuncionario, updateFuncionario);
routes.put("/delete/:id",  deleteFuncionario);

export default routes;