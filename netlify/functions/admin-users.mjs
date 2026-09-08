import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://toluklygrkzsfpqoxkvm.supabase.co";
const AUTH_TIMEOUT_MS = 7500;

const json = (statusCode, payload) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(payload)
});

async function withTimeout(promise, label = "Supabase Auth") {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} svarade inte i tid.`)), AUTH_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return json(503, { error: "SUPABASE_SERVICE_ROLE_KEY saknas i servermiljön." });

  const token = String(event.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(401, { error: "Du är inte inloggad." });

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });

  let caller;
  try {
    const { data, error } = await withTimeout(supabase.auth.getUser(token), "Sessionskontrollen");
    caller = data?.user || null;
    if (error || !caller) return json(401, { error: "Ogiltig session." });
  } catch (error) {
    return json(504, { error: error?.message || "Sessionskontrollen svarade inte i tid." });
  }

  const { data: callerRow, error: callerError } = await supabase
    .from("admins")
    .select("user_id,role")
    .eq("user_id", caller.id)
    .maybeSingle();

  if (callerError) return json(503, { error: "Kunde inte verifiera din adminroll i Supabase." });
  if (!callerRow || callerRow.role !== "owner") return json(403, { error: "Endast Ägare kan hantera admins." });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); }
  catch { return json(400, { error: "Ogiltig begäran." }); }

  const action = body.action;
  const forwardedHost = String(event.headers["x-forwarded-host"] || event.headers.host || "").split(",")[0].trim();
  const forwardedProto = String(event.headers["x-forwarded-proto"] || "https").split(",")[0].trim() || "https";
  const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : "";
  const siteUrl = String(
    process.env.SITE_URL ||
    process.env.URL ||
    requestOrigin ||
    "https://livestream-help.netlify.app"
  ).replace(/\/+$/, "");
  const inviteRedirect = `${siteUrl}/?setup=admin`;

  async function allAuthUsers() {
    const users = [];
    let page = 1;
    while (page <= 10) {
      const { data, error } = await withTimeout(
        supabase.auth.admin.listUsers({ page, perPage: 100 }),
        "Listan över inloggningskonton"
      );
      if (error) throw error;
      const batch = data?.users || [];
      users.push(...batch);
      if (batch.length < 100) break;
      page += 1;
    }
    return users;
  }

  async function ownerCount() {
    const { count, error } = await supabase
      .from("admins")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "owner");
    if (error) throw error;
    return count || 0;
  }

  try {
    if (action === "list") {
      const { data: rows, error: rowsError } = await supabase
        .from("admins")
        .select("user_id,role")
        .order("role", { ascending: false });
      if (rowsError) throw rowsError;

      const authUsers = await allAuthUsers();
      const emailById = new Map(authUsers.map((user) => [user.id, user.email || ""]));
      const users = (rows || []).map((row) => ({
        id: row.user_id,
        email: emailById.get(row.user_id) || "",
        role: row.role === "owner" ? "owner" : "admin"
      }));
      return json(200, { users });
    }

    if (action === "invite") {
      const email = String(body.email || "").trim().toLowerCase();
      if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) {
        return json(400, { error: "Ogiltig e-postadress." });
      }

      const authUsers = await allAuthUsers();
      let user = authUsers.find((item) => String(item.email || "").toLowerCase() === email) || null;

      if (user) {
        const { data: existingAdmin, error: existingAdminError } = await supabase
          .from("admins")
          .select("user_id,role")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existingAdminError) throw existingAdminError;

        if (existingAdmin?.role === "owner") {
          return json(200, {
            ok: true,
            invited: false,
            setupSent: false,
            user: { id: user.id, email: user.email, role: "owner" }
          });
        }

        const confirmed = Boolean(user.email_confirmed_at || user.confirmed_at);
        if (confirmed) {
          const { error: resetError } = await withTimeout(
            supabase.auth.resetPasswordForEmail(email, { redirectTo: inviteRedirect }),
            "Lösenordsmejlet"
          );
          if (resetError) throw resetError;

          if (!existingAdmin) {
            const { error: insertError } = await supabase
              .from("admins")
              .insert({ user_id: user.id, role: "admin" });
            if (insertError) throw insertError;
          }

          return json(200, {
            ok: true,
            invited: false,
            setupSent: true,
            redirectTo: inviteRedirect,
            user: { id: user.id, email: user.email, role: "admin" }
          });
        }

        const { error: deleteError } = await withTimeout(
          supabase.auth.admin.deleteUser(user.id),
          "Rensningen av den gamla inbjudan"
        );
        if (deleteError) throw deleteError;
        user = null;
      }

      const { data, error } = await withTimeout(
        supabase.auth.admin.inviteUserByEmail(email, { redirectTo: inviteRedirect }),
        "Admininbjudan"
      );
      if (error) throw error;
      user = data?.user || null;
      if (!user) throw new Error("Kunde inte skapa den inbjudna användaren.");

      const { error: adminError } = await supabase
        .from("admins")
        .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id" });
      if (adminError) {
        try {
          await withTimeout(supabase.auth.admin.deleteUser(user.id), "Återställningen efter ett fel");
        } catch (cleanupError) {
          console.warn("Kunde inte återställa misslyckad admininbjudan", cleanupError?.message || cleanupError);
        }
        throw adminError;
      }

      return json(200, {
        ok: true,
        invited: true,
        setupSent: true,
        redirectTo: inviteRedirect,
        user: { id: user.id, email: user.email, role: "admin" }
      });
    }

    if (action === "setRole") {
      const userId = String(body.userId || "");
      const role = body.role === "owner" ? "owner" : body.role === "admin" ? "admin" : null;
      if (!userId || !role) return json(400, { error: "Ogiltig roll." });

      const { data: target, error: targetError } = await supabase
        .from("admins")
        .select("user_id,role")
        .eq("user_id", userId)
        .maybeSingle();
      if (targetError || !target) return json(404, { error: "Adminen hittades inte." });
      if (target.role === "owner" && role === "admin" && await ownerCount() <= 1) {
        return json(400, { error: "Det måste alltid finnas minst en Ägare." });
      }

      const { error } = await supabase.from("admins").update({ role }).eq("user_id", userId);
      if (error) throw error;
      return json(200, { ok: true });
    }

    if (action === "remove") {
      const userId = String(body.userId || "");
      if (!userId) return json(400, { error: "Admin saknas." });
      if (userId === caller.id) return json(400, { error: "Du kan inte ta bort din egen adminbehörighet här." });

      const { data: target, error: targetError } = await supabase
        .from("admins")
        .select("user_id,role")
        .eq("user_id", userId)
        .maybeSingle();
      if (targetError || !target) return json(404, { error: "Adminen hittades inte." });
      if (target.role === "owner" && await ownerCount() <= 1) {
        return json(400, { error: "Det måste alltid finnas minst en Ägare." });
      }

      const { error } = await supabase.from("admins").delete().eq("user_id", userId);
      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(400, { error: "Okänd åtgärd." });
  } catch (error) {
    console.error(error);
    const message = error?.message || "Serverfel.";
    const timedOut = /svarade inte i tid/i.test(message);
    return json(timedOut ? 504 : 500, { error: message });
  }
};
