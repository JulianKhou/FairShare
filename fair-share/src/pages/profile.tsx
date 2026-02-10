import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldSet,
    FieldLegend
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/auth/useAuth";
import { getProfile, updateProfile, Profile } from "@/services/supabaseCollum/profiles";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (user) {
            getProfile(user.id).then((data) => {
                if (data) setProfile(data);
                setLoading(false);
            });
        }
    }, [user]);

    const handleChange = (field: keyof Profile, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);
        try {
            await updateProfile(user.id, profile);
            setMessage({ text: "Profile updated successfully!", type: "success" });
        } catch (e) {
            console.error(e);
            setMessage({ text: "Failed to update profile.", type: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl py-10 px-4">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            {message && (
                <div className={`p-4 mb-6 rounded-md ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-8">
                {/* Personal Info */}
                <FieldSet>
                    <FieldLegend>Personal Information</FieldLegend>
                    <FieldGroup>
                        <Field>
                            <FieldLabel>Full Name</FieldLabel>
                            <Input
                                value={profile.full_name || ""}
                                onChange={(e) => handleChange("full_name", e.target.value)}
                                placeholder="John Doe"
                            />
                        </Field>
                    </FieldGroup>
                </FieldSet>

                {/* Address */}
                <FieldSet>
                    <FieldLegend>Address</FieldLegend>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Field className="md:col-span-3">
                            <FieldLabel>Street</FieldLabel>
                            <Input
                                value={profile.address_street || ""}
                                onChange={(e) => handleChange("address_street", e.target.value)}
                                placeholder="Main St"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>No.</FieldLabel>
                            <Input
                                value={profile.address_number || ""}
                                onChange={(e) => handleChange("address_number", e.target.value)}
                                placeholder="123"
                            />
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <Field>
                            <FieldLabel>Zip Code</FieldLabel>
                            <Input
                                value={profile.address_zip || ""}
                                onChange={(e) => handleChange("address_zip", e.target.value)}
                                placeholder="10115"
                            />
                        </Field>
                        <Field className="md:col-span-2">
                            <FieldLabel>City</FieldLabel>
                            <Input
                                value={profile.address_city || ""}
                                onChange={(e) => handleChange("address_city", e.target.value)}
                                placeholder="Berlin"
                            />
                        </Field>
                    </div>
                </FieldSet>

                {/* Channel Info */}
                <FieldSet>
                    <FieldLegend>Channel Information</FieldLegend>
                    <Field>
                        <FieldLabel>Channel ID / URL</FieldLabel>
                        <Input
                            value={profile.youtube_channel_id || ""}
                            onChange={(e) => handleChange("youtube_channel_id", e.target.value)}
                            placeholder="UC..."
                        />
                    </Field>
                </FieldSet>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
