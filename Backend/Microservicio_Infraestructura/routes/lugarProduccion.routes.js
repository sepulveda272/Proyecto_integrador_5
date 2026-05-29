import { Router } from "express";
import { 
    getLugaresProduccion, getLugarProduccion, deleteLugarProduccion, updateLugarProduccion, addLugarProduccion, getLugaresByProductor } from "../controllers/lugarProduccion.controllers.js";

const routes = Router()

routes.get("/", getLugaresProduccion)

routes.post('/add', addLugarProduccion)

// NUEVO: filtra lugares por productor — debe ir ANTES de /:id
// para que Express no interprete "productor" como un id numérico
routes.get('/productor/:idProductor', getLugaresByProductor)

/* La ruta recibe un parametro */
routes.get('/:id', getLugarProduccion)
/* La ruta debe recibir como parametro el id de la categoria a eliminar */
routes.delete('/:id', deleteLugarProduccion)

routes.put('/:id', updateLugarProduccion)

export default routes