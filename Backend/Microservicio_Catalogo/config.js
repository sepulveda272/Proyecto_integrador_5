import {config} from "dotenv";

config();

export default{
    host: process.env.HOST,
    database: process.env.DATABASE,
    usuario: process.env.USUARIO,
    password: process.env.PASSWORD
}