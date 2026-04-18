import { Router } from "express";
import { getLotes, getLoteConCultivo, addLote, updateLote, deleteLote } from "../controllers/lote.controllers.js";

const routes = Router()

routes.get("/", getLotes)

routes.post('/add', addLote)
/* La ruta recibe un parametro */
routes.get('/:id', getLoteConCultivo)
/* La ruta debe recibir como parametro el id de la categoria a eliminar */
routes.delete('/:id', deleteLote)

routes.put('/:id', updateLote)

export default routes