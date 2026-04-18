import { Router } from "express";
import {login} from "../controllers/login.controllers.js";


const routes = Router()

routes.post('/logeate',login);

export default routes