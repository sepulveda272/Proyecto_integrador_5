import { Router } from "express";
import { getInspecciones, getInspeccionesByTecnico, getInspeccion, addInspeccion, updateInspeccion, deleteInspeccion, getLotesInspeccion } from "../controllers/inspeccion.controllers.js";

const routes = Router();

routes.get("/", getInspecciones);
routes.post("/add", addInspeccion);
routes.get("/tecnico/:idTecnico", getInspeccionesByTecnico); // ← antes de /:id para que Express no confunda "tecnico" con un id
routes.get("/:id", getInspeccion);
routes.get('/:id/lotes', getLotesInspeccion);
routes.put("/:id", updateInspeccion);
routes.delete("/:id", deleteInspeccion);

export default routes;