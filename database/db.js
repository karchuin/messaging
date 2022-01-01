import mysql from "mysql2";

import { dbLogin } from "../common/config/default.json";

const pool = mysql.createPool(
  process.env.NODE_ENV === "production" ? dbLogin.pro : dbLogin.dev
).promise();

class Database {
  query (query, data) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await pool.query(query, data);
        resolve(result);
      }
      catch (err) {
        reject(err);
      }
    });
  }
}

const db = new Database();
export default db;