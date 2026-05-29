import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import loginRouter from "../routes/login.routes.js";
import tecnicoRouter from "../routes/tecnico.routes.js";
import funcionarioRouter from "../routes/funcionario.routes.js";
import inspeccionRouter from "../routes/inspeccion.routes.js";
import observacionRouter from "../routes/observacion.routes.js";

dotenv.config();

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;

        this.middlewares();
        this.routes();
    }

    middlewares() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    routes() {
        this.app.use("/login", loginRouter);
        this.app.use("/tecnico", tecnicoRouter);
        this.app.use("/funcionario", funcionarioRouter);
        this.app.use("/inspeccion", inspeccionRouter);
        this.app.use("/observacion", observacionRouter);
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`Server conected on Port ${this.port}`);
        });
    }
}

export default Server;
