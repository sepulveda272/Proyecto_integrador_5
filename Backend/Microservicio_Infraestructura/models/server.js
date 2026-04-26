import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'

import productorRouter from "../routes/productor.routes.js"
import loginRouter from '../routes/login.routes.js';
import lugarProduccionRouter from "../routes/lugarProduccion.routes.js";
import predioRouter from "../routes/predio.routes.js";
import loteRouter from '../routes/lote.routes.js'
import citaRouter from '../routes/cita.routes.js'

dotenv.config()

class Server{
    constructor(){
        this.app = express();
        this.port = process.env.PORT
        this.app.use(cookieParser());

        this.middlewares();
        this.routes();
    }

    middlewares(){
        /* this.app.use(cors({
            origin: 'http://localhost:3000', // Reemplaza con el dominio de tu aplicación React
            credentials: true,
          })); */
        this.app.use(cors());
        this.app.use(express.json());
    }

    routes(){
        this.app.use("/productor", productorRouter);
        this.app.use("/login", loginRouter);
        this.app.use("/lugarPro", lugarProduccionRouter);
        this.app.use("/predio", predioRouter);
        this.app.use("/lote", loteRouter);
        this.app.use("/cita", citaRouter);
    }

    listen(){
        this.app.listen(this.port,()=>{
            console.log(`Server conected on Port ${this.port}`);
        })
    }
}

export default Server