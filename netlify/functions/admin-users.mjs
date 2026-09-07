import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://toluklygrkzsfpqoxkvm.supabase.co";

const json = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(payload)
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return json(503, { error: "SUPABASE_SERVICE_ROLE_KEY saknas i Netlify." });

  const token = String(event.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(401, { error: "Du är inte inloggad." });

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  const caller = authData?.user;
  if (authError || !caller) return json(401, { error: "Ogiltig session." });

  const { data: callerRow, error: callerError } = await supabase
    .from("admins")
    .select("user_id,role")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (callerError) return json(503, { error: "Adminroller är inte aktiverade ännu. Kör supabase-v2.sql i Supabase." });
  if (!callerRow || callerRow.role !== "owner") return json(403, { error: "Endast Ägare kan hantera admins." });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Ogiltig begäran." }); }

  const action = body.action;

  async function allAuthUsers() {
    const users = [];
    let page = 1;
    while (page <= 10) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;
      users.push(...(data?.users || []));
      if ((data?.users || []).length < 100) break;
      page += 1;
    }
    return users;
  }

  async function ownerCount() {
    const { count, error } = await supabase.from("admins").select("user_id", { count: "exact", head: true }).eq("role", "owner");
    if (error) throw error;
    return count || 0;
  }

  try {
    if (action === "list") {
      const [{ data: rows, error: rowsError }, authUsers] = await Promise.all([
        supabase.from("admins").select("user_id,role").order("role", { ascending: false }),
        allAuthUsers()
      ]);
      if (rowsError) throw rowsError;
      const byId = new Map(authUsers.map((user) => [user.id, user]));
      return json(200, {
        users: (rows || []).map((row) => ({
          id: row.user_id,
          email: byId.get(row.user_id)?.email || "",
          role: row.role === "owner" ? "owner" : "admin"
        }))
      });
    }

    if (action === "invite") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return json(400, { error: "Ogiltig e-postadress." });
      const authUsers = await allAuthUsers();
      let user = authUsers.find((item) => String(item.email || "").toLowerCase() === email) || null;
      if (!user) {
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email);
        if (error) throw error;
        user = data?.user || null;
      }
      if (!user) throw new Error("Kunde inte skapa eller hitta användaren.");
      const { error } = await supabase.from("admins").upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id" });
      if (error) throw error;
      return json(200, { ok: true, user: { id: user.id, email: user.email, role: "admin" } });
    }

    if (action === "setRole") {
      const userId = String(body.userId || "");
      const role = body.role === "owner" ? "owner" : body.role === "admin" ? "admin" : null;
      if (!userId || !role) return json(400, { error: "Ogiltig roll." });
      const { data: target, error: targetError } = await supabase.from("admins").select("user_id,role").eq("user_id", userId).maybeSingle();
      if (targetError || !target) return json(404, { error: "Adminen hittades inte." });
      if (target.role === "owner" && role === "admin" && await ownerCount() <= 1) return json(400, { error: "Det måste alltid finnas minst en Ägare." });
      const { error } = await supabase.from("admins").update({ role }).eq("user_id", userId);
      if (error) throw error;
      return json(200, { ok: true });
    }

    if (action === "remove") {
      const userId = String(body.userId || "");
      if (!userId) return json(400, { error: "Admin saknas." });
      if (userId === caller.id) return json(400, { error: "Du kan inte ta bort din egen adminbehörighet här." });
      const { data: target, error: targetError } = await supabase.from("admins").select("user_id,role").eq("user_id", userId).maybeSingle();
      if (targetError || !target) return json(404, { error: "Adminen hittades inte." });
      if (target.role === "owner" && await ownerCount() <= 1) return json(400, { error: "Det måste alltid finnas minst en Ägare." });
      const { error } = await supabase.from("admins").delete().eq("user_id", userId);
      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(400, { error: "Okänd åtgärd." });
  } catch (error) {
    console.error(error);
    return json(500, { error: error?.message || "Serverfel." });
  }
};
