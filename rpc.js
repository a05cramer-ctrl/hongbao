// Solana JSON-RPC proxy so the Helius key stays on the server.
// Vercel env var: HELIUS_API_KEY (optional — falls back to a public RPC).
const ALLOWED = new Set([
  "getLatestBlockhash", "getSlot", "getBalance", "getSignaturesForAddress",
  "getTransaction", "getTokenSupply", "getTokenLargestAccounts"
]);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = null; } }
  const calls = Array.isArray(body) ? body : [body];
  if (!calls.length || calls.length > 20 || calls.some(c => !c || !ALLOWED.has(c.method))) {
    return res.status(400).json({ error: "method not allowed" });
  }
  const key = process.env.HELIUS_API_KEY;
  const url = key ? `https://mainnet.helius-rpc.com/?api-key=${key}` : "https://solana-rpc.publicnode.com";
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await r.text();
    res.status(r.status).setHeader("content-type", "application/json");
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: "rpc unreachable" });
  }
};
