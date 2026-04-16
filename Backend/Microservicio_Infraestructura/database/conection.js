import mysql from "promise-mysql";
import config from "../config.js";

const connection = mysql.createConnection({
    host: config.host,
    database: config.database,
    user: config.usuario,
    password: config.password
});

const getConnection = () =>{
    return connection;
};

export default getConnection;