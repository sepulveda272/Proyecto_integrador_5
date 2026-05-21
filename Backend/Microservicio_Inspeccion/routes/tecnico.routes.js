import { Router } from "express";
import { getTecnicos, getTecnico, addTecnico, updateTecnico, deleteTecnico } from "../controllers/tecnico.controllers.js";

const routes = Router();

routes.get("/", getTecnicos);
routes.post("/add", addTecnico);
routes.get("/:id", getTecnico);
routes.put("/:id", updateTecnico);
routes.delete("/:id", deleteTecnico);

export default routes;
