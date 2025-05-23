const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || "spidersap";

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: "Acceso denegado", 
                message: "Token no proporcionado" 
            });
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({ 
                error: "Acceso denegado", 
                message: "Token no proporcionado o formato inválido" 
            });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            console.error("Error al verificar token:", error);
            return res.status(403).json({ 
                error: "Acceso denegado", 
                message: "Token inválido o expirado" 
            });
        }
    } catch (error) {
        console.error("Error en middleware de autenticación:", error);
        return res.status(500).json({ 
            error: "Error del servidor", 
            message: "Error al procesar la autenticación" 
        });
    }
};

module.exports = verifyToken; 