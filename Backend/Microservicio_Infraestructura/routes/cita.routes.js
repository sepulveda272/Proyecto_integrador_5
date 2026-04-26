import { Router } from "express";
import { getCitas, getCita, addCita, updateCita, deleteCita } from "../controllers/cita.controllers.js";

const routes = Router()

routes.get("/", getCitas)

routes.post('/add', addCita)
/* La ruta recibe un parametro */
routes.get('/:id', getCita)
/* La ruta debe recibir como parametro el id de la categoria a eliminar */
routes.delete('/:id', deleteCita)

routes.put('/:id', updateCita)

export default routes