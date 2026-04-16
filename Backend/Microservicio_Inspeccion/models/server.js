import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'

import pruebaRouter from "../routes/prueba.routes.js"
//import loginRouter from '../routes/login.routes.js';
//import candidatosRouter from "../routes/candidato.routes.js";
//import solicitudesRouter from "../routes/solicitudes.routes.js";
//import searchRouter from '../routes/search.routes.js'

dotenv.config()

class Server{
    constructor(){
        this.app = express();
        this.port = process.env.PORT
        this.app.use(cookieParser());

        this.middlewares();
        this.routes();
    }

    /* middlewares(){
        this.app.use(cors({
            origin: 'http://localhost:3000', // Reemplaza con el dominio de tu aplicación React
            credentials: true,
          }));
        this.app.use(express.json());
    } */

    routes(){
        this.app.use("/usuarios", pruebaRouter);
    }

    listen(){
        this.app.listen(this.port,()=>{
            console.log(`Server conected on Port ${this.port}`);
        })
    }
}

export default Server