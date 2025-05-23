const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER || 'db_a25c05_spidersap_admin',
  password: process.env.DB_PASSWORD || 'cuccus-nahti9-dodPam',
  server: process.env.DB_SERVER || 'sql8020.site4now.net',
  database: process.env.DB_DATABASE || 'db_a25c05_spidersap',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 30000,
    requestTimeout: 30000
  },
};

console.log("Intentando conectar a la base de datos...");

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect()
  .then(() => {
    console.log("✅ Conexión a la base de datos exitosa");
    console.log(`🔌 Conectado a: ${config.server}/${config.database}`);
  })
  .catch((err) => {
    console.error("❌ Error al conectar a la base de datos:", err);
    process.exit(1); // Terminar el proceso si no podemos conectar a la BD
  });

module.exports = { sql, pool, poolConnect };
