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

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Failed to create Stripe Connect account:", error);
        throw error;
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
            // Attempt to read the specific error message from the function response
            if (error && typeof error === 'object' && 'context' in error) {
                 try {
                     // @ts-ignore - access private context if available or standard property
                     const body = await (error as any).context.json();
                     console.error("Function Error Body:", body);
                     if (body?.error) throw new Error(body.error);
                 } catch (e) {
                     console.warn("Could not parse error body", e);
                 }
            }
            throw error;
        }
        return data;
    } catch (error: any) {
        console.error("Failed to create Stripe Checkout session:", error);
        throw new Error(error.message || "Checkout creation failed");
    }
};
