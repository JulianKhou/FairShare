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

/**
 * Downloads the license PDF from Supabase Storage or a direct URL
 * @param contractId The ID of the contract (used as filename for storage fallback)
 * @param fileName The desired filename for the download
 * @param fileUrl Optional direct URL to the file
 */
export const downloadLicensePDF = async (
    contractId: string,
    fileName: string,
    fileUrl?: string,
) => {
    try {
        let blob: Blob;

        if (fileUrl) {
            console.log(`📥 Downloading PDF from URL: ${fileUrl}`);
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch file from URL: ${response.statusText}`,
                );
            }
            blob = await response.blob();
        } else {
            console.log(
                `📥 Downloading PDF from storage for contract: ${contractId}`,
            );
            const { data, error } = await supabase.storage
                .from("licenses")
                .download(`${contractId}.pdf`);

            if (error) {
                console.error("❌ Storage download error:", error);
                throw new Error(`Failed to download PDF: ${error.message}`);
            }

            if (!data) {
                throw new Error("No data received from storage");
            }
            blob = data;
        }

        // Create a download link for the blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        console.error("💥 Failed to download PDF:", error);
        throw error;
    }
};
