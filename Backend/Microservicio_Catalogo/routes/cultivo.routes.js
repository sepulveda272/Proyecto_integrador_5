import { Router } from "express";
import {getCultivos, addCultivo, getCultivo, deleteCultivo, updateCultivo} from "../controllers/cultivo.controllers.js";


const routes = Router()

routes.get("/", getCultivos)

routes.post('/add', addCultivo)
/* La ruta recibe un parametro */
routes.get('/:id', getCultivo)
/* La ruta debe recibir como parametro el id de la categoria a eliminar */
routes.delete('/:id', deleteCultivo)

routes.put('/:id', updateCultivo)

export default routes