import { Router } from "express";
import { getObservaciones, getObservacion, addObservacion, updateObservacion, deleteObservacion } from "../controllers/observacion.controllers.js";

const routes = Router();

routes.get("/", getObservaciones);
routes.post("/add", addObservacion);
routes.get("/:id", getObservacion);
routes.put("/:id", updateObservacion);
routes.delete("/:id", deleteObservacion);

export default routes;
