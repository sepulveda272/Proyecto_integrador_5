import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import cultivoRouter from "../routes/cultivo.routes.js"
import plagaRouter   from "../routes/plaga.routes.js";

dotenv.config()

class Server{
    constructor(){
        this.app = express();
        this.port = process.env.PORT

        this.middlewares();
        this.routes();
    }

    middlewares(){
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use("/uploads", express.static("uploads"));
    }

    routes(){
        this.app.use("/cultivo", cultivoRouter);
        this.app.use("/plaga",   plagaRouter);  
    }

    listen(){
        this.app.listen(this.port,()=>{
            console.log(`Server conected on Port ${this.port}`);
        })
    }
}

export default Server