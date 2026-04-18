import { Router } from "express";
import { getPredios, getPredio, addPredio, deletePredio, updatePredio } from "../controllers/predio.controllers.js";

const routes = Router()

routes.get("/", getPredios)

routes.post('/add', addPredio)
/* La ruta recibe un parametro */
routes.get('/:id', getPredio)
/* La ruta debe recibir como parametro el id de la categoria a eliminar */
routes.delete('/:id', deletePredio)

routes.put('/:id', updatePredio)

export default routes