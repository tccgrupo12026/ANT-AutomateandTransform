/**
 * ANT — Automate and Transform
 * Supabase Edge Function: accept-invite
 *
 * Cria o usuário convidado diretamente no Supabase Auth via Admin API (service_role)
 * com `email_confirm: true`, eliminando o envio de e-mails de confirmação e contornando
 * permanentemente o erro de "email rate limit exceeded" do SMTP embutido do Supabase.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptPayload {
  token: string;
  password: string;
}

serve(async (req) => {
  // Trata preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas na Edge Function.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body: AcceptPayload = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Campos obrigatórios ausentes: token ou senha." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Busca convite na tabela company_members
    const { data: member, error: memberErr } = await supabaseAdmin
      .from("company_members")
      .select("*")
      .eq("invite_token", token)
      .single();

    if (memberErr || !member) {
      return new Response(
        JSON.stringify({ success: false, error: "Convite não encontrado ou token inválido." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Valida expiração
    if (member.expires_at && new Date(member.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: "Este convite expirou. Solicite um novo convite." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId = "";

    // 2. Cria usuário no Auth com email_confirm: true (sem disparar e-mails nem rate limit)
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: member.email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: member.name,
        company_name: member.company_name || "Minha Empresa",
        company_id: member.company_id,
        role: member.role,
        is_invited: true,
      },
    });

    if (createErr) {
      const msg = createErr.message || "";
      // Se já existir, busca usuário e atualiza senha e confirmação de e-mail
      if (msg.includes("already registered") || msg.includes("already exists")) {
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        const existing = usersList?.users?.find(
          (u) => u.email?.toLowerCase() === member.email.toLowerCase()
        );
        if (existing) {
          userId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: password,
            email_confirm: true,
          });
        } else {
          return new Response(
            JSON.stringify({ success: false, error: msg }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ success: false, error: msg }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (createData?.user) {
      userId = createData.user.id;
    }

    // 3. Atualiza o status em company_members
    const nowIso = new Date().toISOString();
    await supabaseAdmin
      .from("company_members")
      .update({
        user_id: userId,
        status: "active",
        joined_at: nowIso,
        updated_at: nowIso,
      })
      .eq("invite_token", token);

    return new Response(
      JSON.stringify({ success: true, userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Erro interno na Edge Function" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
