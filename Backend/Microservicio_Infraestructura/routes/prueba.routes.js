import { Router } from "express";
import {getCategorias, addCategorias, getCategoria, deleteCategoria, updateCategorias} from "../controllers/prueba.js";


const routes = Router()

routes.get("/", getCategorias)

routes.post('/add', addCategorias)
/* La ruta recibe un parametro */
routes.get('/:id', getCategoria)
/* La ruta debe recibir como parametro el id de la categoria a eliminar */
routes.delete('/:id', deleteCategoria)

routes.put('/:id', updateCategorias)

export default routes