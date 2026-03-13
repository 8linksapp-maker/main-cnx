import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
    // CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const payload = await req.json();

        // Parsing flexível (Kiwify envia o pedido em 'order' ou no root)
        let order = payload.order || (payload.webhook_event_type ? payload : null);

        if (!order) {
            console.error('Payload inválido: Pedido não encontrado.');
            return new Response('Payload inválido', { status: 400 });
        }

        const eventType = payload.webhook_event_type || order.order_status;
        const customerEmail = (order.Customer?.email || '').replace(/\s/g, '');
        const customerName = order.Customer?.full_name || 'Cliente';
        const subscriptionId = order.subscription_id || order.order_id || 'manual';

        console.log(`--- [WEBHOOK] Evento: ${eventType} | Email: ${customerEmail} ---`);

        if (eventType === 'order_approved' || order.order_status === 'paid') {
            const expiryDate = order.Subscription?.next_payment || order.order_approved_date;

            if (!customerEmail) throw new Error('Email do cliente ausente');

            let userId: string;

            // 1. Tentar criar usuário diretamente (Já confirmado para evitar travas de e-mail)
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: customerEmail,
                email_confirm: true,
                user_metadata: { name: customerName, source: 'kiwify' }
            });

            if (createError) {
                console.log(`Usuário já existe ou erro: ${createError.message}. Recuperando ID...`);
                // Se já existe, geramos um link (magiclink) apenas para capturar o objeto do usuário e o ID
                const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: customerEmail
                });

                if (!linkData?.user) throw new Error(`Falha ao recuperar usuário: ${createError.message}`);
                userId = linkData.user.id;
            } else {
                userId = newUser.user.id;
                console.log(`Novo usuário criado: ${userId}`);

                // 2. DISPARO DO E-MAIL DE ACESSO (Via Reset Password)
                // O usuário recebe o e-mail oficial para escolher a senha e já entra no sistema.
                console.log(`Enviando e-mail de acesso via Reset Password...`);
                await supabaseAdmin.auth.resetPasswordForEmail(customerEmail, {
                    // AJUSTE: Mude para a URL do seu site em produção
                    redirectTo: `https://${new URL(supabaseUrl).hostname.replace('.supabase.co', '')}.vercel.app/update-password`,
                });
            }

            // 3. Garantir Perfil e Data de Expiração na tabela 'profiles'
            const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
                id: userId,
                subscription_status: 'active',
                payment_provider: 'kiwify',
                kiwify_subscription_id: subscriptionId,
                subscription_period_end: expiryDate ? new Date(expiryDate).toISOString() : null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

            if (profileError) throw profileError;
            console.log(`Acesso garantido para ${userId} até ${expiryDate || 'sempre'}.`);

        } else if (eventType === 'order_refunded' || eventType === 'subscription_canceled') {
            console.log(`Revogando acesso: ${subscriptionId}`);
            await supabaseAdmin
                .from('profiles')
                .update({ subscription_status: 'inactive' })
                .eq('kiwify_subscription_id', subscriptionId);
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error(`[ERRO]: ${msg}`);
        return new Response(JSON.stringify({ error: msg }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
});
