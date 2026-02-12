import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  getProfile,
  updateProfile,
  Profile,
} from "@/services/supabaseCollum/profiles";
import { Loader2 } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyLicenses } from "@/components/profile/MyLicenses";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

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
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {message && (
        <div
          className={`p-4 mb-6 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="licenses">My Licenses</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <div className="space-y-8 max-w-2xl">
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
                    onChange={(e) =>
                      handleChange("address_street", e.target.value)
                    }
                    placeholder="Main St"
                  />
                </Field>
                <Field>
                  <FieldLabel>No.</FieldLabel>
                  <Input
                    value={profile.address_number || ""}
                    onChange={(e) =>
                      handleChange("address_number", e.target.value)
                    }
                    placeholder="123"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Field>
                  <FieldLabel>Zip Code</FieldLabel>
                  <Input
                    value={profile.address_zip || ""}
                    onChange={(e) =>
                      handleChange("address_zip", e.target.value)
                    }
                    placeholder="10115"
                  />
                </Field>
                <Field className="md:col-span-2">
                  <FieldLabel>City</FieldLabel>
                  <Input
                    value={profile.address_city || ""}
                    onChange={(e) =>
                      handleChange("address_city", e.target.value)
                    }
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
                  onChange={(e) =>
                    handleChange("youtube_channel_id", e.target.value)
                  }
                  placeholder="UC..."
                />
              </Field>
            </FieldSet>

            {/* Stripe Connect */}
            <FieldSet>
              <FieldLegend>Payout Settings</FieldLegend>
              <div className="flex flex-col gap-4">
                <FieldDescription>
                  Connect your Stripe account to receive payments from sold
                  licenses.
                </FieldDescription>

                {profile.stripe_connect_id ? (
                  <div className="flex flex-col gap-2">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-center gap-2">
                      <span className="text-xl">✅</span>
                      <div>
                        <p className="font-bold">Stripe Connected</p>
                        <p className="text-sm">
                          Account ID: {profile.stripe_connect_id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          setSaving(true);
                          const { createStripeConnectAccount } =
                            await import("@/services/stripeFunctions");
                          const { url } = await createStripeConnectAccount();
                          if (url) window.location.href = url;
                        } catch (err) {
                          console.error(err);
                          setMessage({
                            text: "Failed to open Stripe Dashboard.",
                            type: "error",
                          });
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      Complete Setup / View Dashboard
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={async () => {
                      try {
                        setSaving(true);
                        const { createStripeConnectAccount } =
                          await import("@/services/stripeFunctions");
                        const { url } = await createStripeConnectAccount();
                        if (url) window.location.href = url;
                      } catch (err) {
                        console.error(err);
                        setMessage({
                          text: "Failed to start Stripe onboarding.",
                          type: "error",
                        });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    Connect with Stripe
                  </Button>
                )}
              </div>
            </FieldSet>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="licenses">
          <MyLicenses />
        </TabsContent>
      </Tabs>
    </div>
  );
}
