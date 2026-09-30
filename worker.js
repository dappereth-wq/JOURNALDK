const TRADOVATE_API = "https://live.tradovateapi.com/v1";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    try {
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          service: "DK Trading Journal API",
          version: "1.0.0"
        });
      }

      if (url.pathname === "/api/account") {
        const data = await getTradovateAccount(env);

        return json({
          ok: true,
          account: data
        });
      }

      return json({
        ok: false,
        error: "Endpoint not found"
      }, 404);

    } catch (error) {
      return json({
        ok: false,
        error: error.message
      }, 500);
    }
  }
};

async function getTradovateToken(env) {
  const response = await fetch(
    `${TRADOVATE_API}/auth/accesstokenrequest`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: env.TRADOVATE_NAME,
        password: env.TRADOVATE_PASSWORD,
        appId: env.TRADOVATE_APP_ID,
        appVersion: env.TRADOVATE_APP_VERSION,
        cid: Number(env.TRADOVATE_CID),
        sec: env.TRADOVATE_SEC
      })
    }
  );

  const data = await response.json();

  if (!response.ok || !data.accessToken) {
    throw new Error(
      data.errorText || "No se pudo autenticar con Tradovate"
    );
  }

  return data.accessToken;
}

async function getTradovateAccount(env) {
  const token = await getTradovateToken(env);

  const response = await fetch(
    `${TRADOVATE_API}/account/list`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.errorText || "No se pudieron obtener las cuentas"
    );
  }

  return data;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders()
      }
    }
  );
}
