import { Router } from "express";
import { getInspecciones, getInspeccion, addInspeccion, updateInspeccion, deleteInspeccion } from "../controllers/inspeccion.controllers.js";

const routes = Router();

routes.get("/", getInspecciones);
routes.post("/add", addInspeccion);
routes.get("/:id", getInspeccion);
routes.put("/:id", updateInspeccion);
routes.delete("/:id", deleteInspeccion);

export default routes;
