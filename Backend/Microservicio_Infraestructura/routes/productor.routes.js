import { Router } from "express";
import {getProductores, addProductor, getProductor, deleteProductor, updateProductor} from "../controllers/productor.controllers.js";


const routes = Router()

routes.get("/", getProductores)

routes.post('/add', addProductor)
/* La ruta recibe un parametro */
routes.get('/:id', getProductor)
/* La ruta debe recibir como parametro el id de la categoria a eliminar */
routes.put('/delete/:id', deleteProductor)

routes.put('/:id', updateProductor)

export default routes