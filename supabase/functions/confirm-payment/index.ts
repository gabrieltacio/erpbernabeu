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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { sessionId } = await req.json();

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Recuperar sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const metadata = session.metadata;

      // Criar agendamento
      const { data: appointment, error: appointmentError } = await supabaseClient
        .from('appointments')
        .insert({
          client_id: metadata.client_id,
          professional_id: metadata.professional_id,
          service_id: metadata.service_id,
          scheduled_date: metadata.scheduled_date,
          scheduled_time: metadata.scheduled_time,
          notes: metadata.notes,
          status: 'confirmado',
          paid: true,
        })
        .select()
        .single();

      if (appointmentError) throw appointmentError;

      // Criar registro de pagamento
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          client_id: metadata.client_id,
          appointment_id: appointment.id,
          amount: session.amount_total / 100, // Converter de centavos
          method: 'stripe',
          status: 'completed',
          stripe_session_id: sessionId,
        });

      if (paymentError) throw paymentError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          appointment: appointment,
          message: 'Agendamento confirmado e pagamento processado com sucesso!'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Pagamento não foi processado com sucesso.'
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});