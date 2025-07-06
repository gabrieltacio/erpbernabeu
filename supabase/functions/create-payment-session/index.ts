import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const { appointmentData, clientData, serviceData, professionalData } = await req.json();

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `${serviceData.name} - ${professionalData.name}`,
              description: `Agendamento para ${appointmentData.scheduled_date} às ${appointmentData.scheduled_time}`,
            },
            unit_amount: Math.round(serviceData.price * 100), // Converter para centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/agendamentos?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/agendamentos?payment=cancelled`,
      customer_email: clientData.email || undefined,
      metadata: {
        client_id: appointmentData.client_id,
        professional_id: appointmentData.professional_id,
        service_id: appointmentData.service_id,
        scheduled_date: appointmentData.scheduled_date,
        scheduled_time: appointmentData.scheduled_time,
        notes: appointmentData.notes || '',
        user_id: user.id,
      },
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        amount: serviceData.price 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao criar sessão de pagamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});