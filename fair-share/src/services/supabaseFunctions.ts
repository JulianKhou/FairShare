import { supabase } from "./supabaseCollum/client";

/**
 * Calls the generate-license-pdf Edge Function to generate and email a PDF contract
 * @param contractId The ID of the reaction contract
 * @returns Promise<{ success: boolean }> or throws error
 */
export const generateLicensePDF = async (
    contractId: string,
): Promise<{ success: boolean }> => {
    try {
        console.log(
            "📤 Calling generate-license-pdf with contractId:",
            contractId,
        );

        const { data, error } = await supabase.functions.invoke(
            "generate-license-pdf",
            {
                body: { contractId },
            },
        );

        if (error) {
            console.error("❌ Edge function error:", {
                message: error.message,
                name: error.name,
                context: error.context,
            });
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }

        console.log("✅ PDF generation successful:", data);
        return data;
    } catch (error) {
        console.error("💥 Failed to call generate-license-pdf:", error);
        throw error;
    }
};
