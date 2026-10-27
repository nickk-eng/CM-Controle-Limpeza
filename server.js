"use strict";
const express = require("express");
const { Pool } = require("pg");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { timingSafeEqual, randomBytes } = require("node:crypto");
if (!process.env.DATABASE_URL || !process.env.APP_PASSWORD)
  throw new Error("Configure DATABASE_URL e APP_PASSWORD.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.disable("x-powered-by");
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.sendStatus(503);
  }
});

app.use(express.json({ limit: "32kb" }));
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const sessions = new Map();
const attempts = new Map();
const duration = 8 * 60 * 60 * 1000;
const username = process.env.APP_USERNAME || "funcionarios";
const secure =
  process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
function equal(a, b) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function token(req) {
  return (req.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("cm_session="))
    ?.slice(11);
}
function cookie(value, age) {
  return (
    "cm_session=" +
    value +
    "; HttpOnly; SameSite=Strict; Path=/; Max-Age=" +
    age +
    (secure ? "; Secure" : "")
  );
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions) if (v <= now) sessions.delete(k);
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
}, 60000).unref();
app.get("/style.css", (req, res) =>
  res.sendFile(path.join(__dirname, "style.css")),
);
app.get("/login.js", (req, res) =>
  res.sendFile(path.join(__dirname, "login.js")),
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "login.html")),
);
app.post("/api/login", (req, res) => {
  const ip = req.ip,
    now = Date.now(),
    previous = attempts.get(ip);
  if (previous && previous.until > now && previous.count >= 10)
    return res
      .status(429)
      .json({ error: "Muitas tentativas. Aguarde 15 minutos." });
  const { usuario, senha } = req.body || {};
  if (
    typeof usuario !== "string" ||
    typeof senha !== "string" ||
    !equal(usuario, username) ||
    !equal(senha, process.env.APP_PASSWORD)
  ) {
    const attempt =
      previous && previous.until > now
        ? previous
        : { count: 0, until: now + 15 * 60000 };
    attempt.count++;
    attempts.set(ip, attempt);
    return res.status(401).json({ error: "Usuário ou senha incorretos." });
  }
  attempts.delete(ip);
  const id = randomBytes(32).toString("hex");
  sessions.set(id, now + duration);
  res.set("Set-Cookie", cookie(id, duration / 1000)).json({ ok: true });
});
app.post("/api/logout", (req, res) => {
  sessions.delete(token(req));
  res.set("Set-Cookie", cookie("", 0)).sendStatus(204);
});
app.use((req, res, next) => {
  const id = token(req),
    expires = sessions.get(id);
  if (expires && expires > Date.now()) return next();
  if (id) sessions.delete(id);
  if (req.path.startsWith("/api/"))
    return res.status(401).json({ error: "Entre para continuar." });
  res.redirect("/login");
});
const fields =
  "id,nome,responsavel,setor,to_char(data,'YYYY-MM-DD') AS data,to_char(horario,'HH24:MI') AS horario,concluida,concluida_em";
function validDate(v) {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v
  );
}
app.get("/api/tarefas", async (req, res) => {
  if (!validDate(req.query.data))
    return res.status(400).json({ error: "Data inválida." });
  res.json(
    (
      await pool.query(
        `SELECT ${fields} FROM tarefas WHERE data=$1 ORDER BY horario,nome`,
        [req.query.data],
      )
    ).rows,
  );
});
app.param("id", (req, res, next, id) => {
  if (!/^[a-zA-Z0-9-]{1,120}$/.test(id)) return res.sendStatus(400);
  next();
});
app.put("/api/tarefas/:id", async (req, res) => {
  const { nome, responsavel, setor, data, horario } = req.body;
  if (
    ![
      [nome, 120],
      [responsavel, 80],
      [setor, 80],
    ].every(
      ([v, n]) =>
        typeof v === "string" && v.trim().length > 0 && v.trim().length <= n,
    ) ||
    !validDate(data) ||
    typeof horario !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(horario)
  )
    return res.status(400).json({ error: "Dados inválidos." });
  res.json(
    (
      await pool.query(
        `INSERT INTO tarefas(id,nome,responsavel,setor,data,horario) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET nome=$2,responsavel=$3,setor=$4,data=$5,horario=$6 RETURNING ${fields}`,
        [
          req.params.id,
          nome.trim(),
          responsavel.trim(),
          setor.trim(),
          data,
          horario,
        ],
      )
    ).rows[0],
  );
});
app.patch("/api/tarefas/:id/conclusao", async (req, res) => {
  if (typeof req.body.concluida !== "boolean") return res.sendStatus(400);
  const r = await pool.query(
    `UPDATE tarefas SET concluida=$2,concluida_em=CASE WHEN $2 THEN COALESCE(concluida_em,NOW()) ELSE NULL END WHERE id=$1 RETURNING ${fields}`,
    [req.params.id, req.body.concluida],
  );
  if (!r.rowCount) return res.sendStatus(404);
  res.json(r.rows[0]);
});
app.delete("/api/tarefas/:id", async (req, res) => {
  await pool.query("DELETE FROM tarefas WHERE id=$1", [req.params.id]);
  res.sendStatus(204);
});
for (const file of ["index.html", "script.js", "style.css"])
  app.get(file === "index.html" ? "/" : "/" + file, (req, res) =>
    res.sendFile(path.join(__dirname, file)),
  );
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: "Não foi possível concluir a operação." });
});
async function start() {
  await pool.query(readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  app.listen(process.env.PORT || 3000, "0.0.0.0");
}
start().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
