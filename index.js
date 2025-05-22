const express = require("express");
require("dotenv").config();
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger');
const usuariosRouter = require("./routes/usuarios");

const app = express();
app.use(cors()); // 👈 importante
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rutas
app.use("/usuarios", usuariosRouter);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
});
