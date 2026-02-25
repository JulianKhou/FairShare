import { supabase } from "./supabaseCollum/client";

/**
 * Calls the create-connect-account Edge Function to generate an onboarding link
 * @returns Promise<{ url: string }> or throws error
 */
export const createStripeConnectAccount = async (): Promise<{ url: string }> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No active session");

        const { data, error } = await supabase.functions.invoke(
            "create-connect-account",
            {
                method: "POST",
            }
        );

        if (error) {
            console.error("Invoke Error:", error);
            let errorMessage = "Unknown error during edge function invocation";
            if (error && typeof error === 'object' && 'context' in error) {
                try {
                    // @ts-ignore
                    const body = await (error as any).context.json();
                    console.error("Function Error Body:", body);
                    if (body?.error) errorMessage = body.error;
                } catch (e) {
                    console.warn("Could not parse error body as JSON.", e);
                }
            }
            throw new Error(errorMessage);
        }
        return data;
    } catch (error: any) {
        console.error("Failed to create Stripe Connect account:", error);
        throw new Error(error.message || "Account creation failed");
    }
};

/**
 * Calls the create-checkout-session Edge Function to start payment flow
 * @param contractId The ID of the reaction contract
 * @returns Promise<{ url: string }> or throws error
 */
export const createStripeCheckoutSession = async (
    contractId: string
): Promise<{ url: string }> => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No active session");

        const { data, error } = await supabase.functions.invoke(
            "create-checkout-session",
            {
                body: { contractId },
            }
        );

        if (error) {
            console.error("Invoke Error:", error);
            // Safely attempt to read specific error message
            let errorMessage = "Unknown error during edge function invocation";
            if (error && typeof error === 'object' && 'context' in error) {
                try {
                    // @ts-ignore
                    const body = await (error as any).context.json();
                    console.error("Function Error Body:", body);
                    if (body?.error) errorMessage = body.error;
                } catch (e) {
                    console.warn("Could not parse error body as JSON. Raw response might be text/html.", e);
                    // If it's a 500 html Deno error, .json() will throw. We'll fallback to the default error message
                }
            }
            throw new Error(errorMessage);
        }
        return data;
    } catch (error: any) {
        console.error("Failed to create Stripe Checkout session:", error);
        throw new Error(error.message || "Checkout creation failed");
    }
};
