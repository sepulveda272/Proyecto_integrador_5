import { Router } from "express";
import { getFuncionarios, getFuncionario, addFuncionario, updateFuncionario, deleteFuncionario } from "../controllers/funcionario.controllers.js";

const routes = Router();

routes.get("/", getFuncionarios);
routes.post("/add", addFuncionario);
routes.get("/:id", getFuncionario);
routes.put("/:id", updateFuncionario);
routes.delete("/:id", deleteFuncionario);

export default routes;
