import jwt from "jsonwebtoken";
const generateJWT = (id = "") => {
  return new Promise((resolve, reject) => {
    const payload = { id };
    jwt.sign(
      payload,
      process.env.SECRET_OR_PRIVATE_KEY,
      {
        expiresIn: "1d",
      },
      (err, token) => {
        if (err) {
          console.log(err);
          reject("No se pudo generar el JSON WEB TOKEN");
        } else {
          resolve(token);
        }
      }
    );
  });
};
export default generateJWT;