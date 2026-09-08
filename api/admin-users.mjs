import { handler as netlifyHandler } from "../netlify/functions/admin-users.mjs";

export default async function handler(req, res) {
  let body = "";
  if (req.body !== undefined && req.body !== null) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  const event = {
    httpMethod: req.method || "GET",
    headers: req.headers || {},
    body
  };

  const result = await netlifyHandler(event);
  const statusCode = Number(result?.statusCode || 200);

  for (const [key, value] of Object.entries(result?.headers || {})) {
    if (value !== undefined) res.setHeader(key, value);
  }

  res.status(statusCode).send(result?.body || "");
}
