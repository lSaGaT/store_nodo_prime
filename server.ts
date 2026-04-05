import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createSupabase } from "./src/lib/supabase.js";
import { asaas } from "./src/lib/asaas.js";
import { r2 } from "./src/lib/r2.js";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // 6.1 POST /api/checkout
  app.post("/api/checkout", async (req, res) => {
    try {
      const { slug, nome, documento, email, billingType } = req.body;
      if (!slug || !nome || !documento || !email || !billingType) {
        return res.status(400).json({ error: "Dados inválidos" });
      }

      const supabase = createSupabase();
      if (!supabase) return res.status(500).json({ error: "Erro de configuração do banco" });

      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("ativo", true)
        .single();

      if (error || !product) return res.status(404).json({ error: "Produto não encontrado" });

      // Fluxo n8n: criar cliente -> wait 5s -> criar cobrança
      const { customer, payment } = await asaas.createCustomerAndPayment(
        nome,
        documento,
        email,
        billingType,
        product.preco,
        `${product.nome} — NodoPrime`
      );

      await supabase.from("orders").insert({
        product_id: product.id,
        asaas_payment_id: payment.id,
        email,
        status: "pending",
        valor: product.preco,
      });

      res.json({ paymentId: payment.id, invoiceUrl: payment.invoiceUrl });
    } catch (err: any) {
      console.error('Checkout error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 6.2 POST /api/webhook
  app.post("/api/webhook", async (req, res) => {
    // Log para debug
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));

    const { event, payment } = req.body;

    // Aceitar apenas eventos de confirmação de pagamento
    if (!["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(event)) {
      console.log('Evento ignorado:', event);
      return res.json({ ok: true });
    }

    console.log('Pagamento confirmado:', payment.id);

    const supabase = createSupabase();
    if (!supabase) return res.status(500).json({ error: "Erro de configuração" });

    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "paid", forma_pagamento: payment.billingType })
      .eq("asaas_payment_id", payment.id)
      .select()
      .single();

    if (error || !order) {
      console.error('Pedido não encontrado:', payment.id, error);
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Criar token de download
    await supabase.from("download_tokens").insert({ order_id: order.id });
    console.log('Download token criado para pedido:', order.id);

    res.json({ ok: true });
  });

  // 6.3 GET /api/status/:paymentId
  app.get("/api/status/:paymentId", async (req, res) => {
    const supabase = createSupabase();
    if (!supabase) return res.status(500).json({ error: "Erro de configuração" });

    const { data: order } = await supabase
      .from("orders")
      .select(`
        id,
        status,
        download_tokens (
          token,
          expires_at,
          downloaded
        )
      `)
      .eq("asaas_payment_id", req.params.paymentId)
      .single();

    if (!order) return res.status(404).json({ status: "not_found" });

    // @ts-ignore
    const token = order.download_tokens?.[0];
    res.json({
      status: order.status,
      token: order.status === "paid" ? token?.token : null,
      expiresAt: token?.expires_at ?? null,
    });
  });

  // 6.4 GET /api/download/:token
  app.get("/api/download/:token", async (req, res) => {
    const supabase = createSupabase();
    if (!supabase) return res.status(500).json({ error: "Erro de configuração" });

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";

    const { data: tokenRecord } = await supabase
      .from("download_tokens")
      .select(`
        *,
        orders (
          status,
          products (
            file_key,
            nome
          )
        )
      `)
      .eq("token", req.params.token)
      .single();

    if (!tokenRecord) return res.status(404).send("Link inválido.");
    if (tokenRecord.downloaded) return res.status(410).send("Este link já foi utilizado.");
    if (new Date(tokenRecord.expires_at) < new Date()) return res.status(410).send("Este link expirou.");
    // @ts-ignore
    if (tokenRecord.orders?.status !== "paid") return res.status(402).send("Pagamento não confirmado.");

    // @ts-ignore
    const fileKey = tokenRecord.orders.products?.file_key;
    if (!fileKey) return res.status(404).send("Arquivo não encontrado.");

    await supabase.from("download_tokens").update({ downloaded: true, used_by_ip: ip }).eq("token", req.params.token);

    const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: fileKey });
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 60 });
    res.redirect(signedUrl);
  });

  // 6.5 POST /api/admin/upload
  app.post("/api/admin/upload", upload.single("file"), async (req, res) => {
    const { nome, slug, descricao, descricao_longa, preco, accessToken } = req.body;
    const file = req.file;

    if (!accessToken) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const supabaseAdmin = createSupabase();
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Erro de configuração do banco" });
    }

    // Decodificar JWT para obter user_id
    let userId: string | null = null;
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = payload.sub;
        console.log('Decoded JWT:', { userId, email: payload.email });
      }
    } catch (e) {
      console.log('JWT decode error:', e);
    }

    if (!userId) {
      return res.status(401).json({ error: "Token inválido" });
    }

    // Verificar role do usuário
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    console.log('Profile check:', { userId, profile });

    if (profile?.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado: Requer privilégios de admin" });
    }

    if (!file || !nome || !slug || !preco) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const fileKey = `produtos/${slug}-${Date.now()}.zip`;
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: fileKey,
      Body: file.buffer,
      ContentType: "application/zip",
      ContentDisposition: `attachment; filename="${slug}.zip"`,
    }));

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({ nome, slug, descricao, descricao_longa, preco: parseFloat(preco), file_key: fileKey })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true, product: data });
  });

  // GET /api/products
  app.get("/api/products", async (req, res) => {
    const supabase = createSupabase();
    if (!supabase) return res.status(500).json({ error: "Erro de configuração" });
    const { data, error } = await supabase.from("products").select("*").eq("ativo", true).order("ordem");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // GET /api/products/:slug
  app.get("/api/products/:slug", async (req, res) => {
    const supabase = createSupabase();
    if (!supabase) return res.status(500).json({ error: "Erro de configuração" });
    const { data, error } = await supabase.from("products").select("*").eq("slug", req.params.slug).single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // GET /api/admin/products - List all products (including inactive)
  app.get("/api/admin/products", async (req, res) => {
    const supabase = createSupabase();
    if (!supabase) return res.status(500).json({ error: "Erro de configuração" });
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // DELETE /api/admin/products/:id - Delete a product
  app.delete("/api/admin/products/:id", async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const supabaseAdmin = createSupabase();
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Erro de configuração do banco" });
    }

    // Decodificar JWT para obter user_id
    let userId: string | null = null;
    try {
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = payload.sub;
      }
    } catch (e) {
      return res.status(401).json({ error: "Token inválido" });
    }

    // Verificar role do usuário
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Deletar produto (soft delete - marca como inativo)
    const { error } = await supabaseAdmin
      .from("products")
      .update({ ativo: false })
      .eq("id", req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
