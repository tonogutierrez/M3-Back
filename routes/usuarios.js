const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { pool, poolConnect, sql } = require("../db");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/auth");
const SECRET_KEY = "tu_clave_secreta"; // idealmente poner en .env

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre
 *         - correo
 *         - contrasena
 *       properties:
 *         IdUsuario:
 *           type: integer
 *           description: ID auto-generado del usuario
 *         nombre:
 *           type: string
 *           description: Nombre del usuario
 *         correo:
 *           type: string
 *           description: Correo electrónico del usuario
 *         contrasena:
 *           type: string
 *           description: Contraseña del usuario (no se devuelve en las respuestas)
 */

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - contrasena
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       400:
 *         description: Datos inválidos en la solicitud
 *       500:
 *         description: Error del servidor
 */
router.post("/",async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }

  try {
    await poolConnect;
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const request = pool.request();
    request.input("Correo", sql.NVarChar(255), correo);
    request.input("ContrasenaHash", sql.NVarChar(256), hashedPassword);

    await request.query(`
      INSERT INTO UsuariosVidal (Correo, ContrasenaHash)
      VALUES (@Correo, @ContrasenaHash)
    `);

    res.status(201).json({ mensaje: "Usuario creado correctamente." });
  } catch (error) {
    console.error("Error al registrar:", error);
    res.status(500).json({ error: "Error del servidor." });
  }
});

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado - Token no proporcionado
 *       403:
 *         description: Prohibido - Token inválido
 *       500:
 *         description: Error del servidor
 */
// GET /usuarios - obtener todos los usuarios
router.get("/", verifyToken, async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query("SELECT * FROM UsuariosVidal");

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado - Token no proporcionado
 *       403:
 *         description: Prohibido - Token inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
// GET /usuarios/:id - obtener un usuario por ID
router.get("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    await poolConnect;

    const request = pool.request();
    request.input("IdUsuario", sql.Int, id);

    const result = await request.query(`
      SELECT * FROM UsuariosVidal WHERE IdUsuario = @IdUsuario
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener usuario por ID:", error);
    res.status(500).json({ error: "Error al buscar el usuario." });
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualizar el nombre de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nombre actualizado correctamente
 *       401:
 *         description: No autorizado - Token no proporcionado
 *       403:
 *         description: Prohibido - Token inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
// PUT /usuarios/:id - actualizar el nombre de un usuario
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: "El campo 'nombre' es obligatorio." });
  }

  try {
    await poolConnect;

    const request = pool.request();
    request.input("IdUsuario", sql.Int, id);
    request.input("NuevoNombre", sql.NVarChar(100), nombre);

    const result = await request.query(`
      UPDATE UsuariosVidal
      SET Nombre = @NuevoNombre
      WHERE IdUsuario = @IdUsuario
    `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    res.json({ mensaje: "Nombre actualizado correctamente." });
  } catch (error) {
    console.error("Error al actualizar el nombre:", error);
    res.status(500).json({ error: "Error al actualizar el nombre del usuario." });
  }
});

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contrasena
 *             properties:
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 usuario:
 *                   $ref: '#/components/schemas/Usuario'
 *                 token:
 *                   type: string
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error del servidor
 */
// POST /usuarios/login - iniciar sesión
router.post("/login", async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos." });
  }

  try {
    await poolConnect;

    const request = pool.request();
    request.input("Correo", sql.NVarChar(255), correo);

    const result = await request.query(`
      SELECT IdUsuario, Correo, ContrasenaHash, Nombre
      FROM UsuariosVidal 
      WHERE Correo = @Correo
    `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const usuario = result.recordset[0];
    const passwordMatch = await bcrypt.compare(contrasena, usuario.ContrasenaHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "spidersap";

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.IdUsuario, 
        correo: usuario.Correo,
        nombre: usuario.Nombre 
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Enviar respuesta exitosa
    res.json({
      mensaje: "Inicio de sesión exitoso.",
      usuario: {
        id: usuario.IdUsuario,
        nombre: usuario.Nombre,
        correo: usuario.Correo
      },
      token
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error al procesar la solicitud de inicio de sesión." });
  }
});

module.exports = router;
