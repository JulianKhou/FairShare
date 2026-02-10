import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
} from "@/components/ui/field";

import { useAuth } from "@/hooks/auth/useAuth";
import { getProfile, updateProfile } from "@/services/supabaseCollum/profiles";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { user } = useAuth();
    const [autoAccept, setAutoAccept] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            setLoading(true);
            getProfile(user.id).then((profile) => {
                if (profile) {
                    setAutoAccept(profile.auto_accept_reactions || false);
                }
                setLoading(false);
            });
        }
    }, [isOpen, user]);

    const handleToggle = async (checked: boolean) => {
        if (!user) return;
        setAutoAccept(checked);
        try {
            await updateProfile(user.id, { auto_accept_reactions: checked });
        } catch (e) {
            console.error("Failed to update profile", e);
            // Revert on failure
            setAutoAccept(!checked);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                    <h2 className="text-lg font-semibold leading-none tracking-tight">
                        Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your account settings and preferences.
                    </p>
                </div>

                <div className="grid gap-4 py-4">
                    <Field orientation="horizontal" className="flex items-center justify-between rounded-lg border p-4">
                        <FieldContent>
                            <FieldLabel className="text-base">
                                Auto-accept Reaction Requests
                            </FieldLabel>
                            <FieldDescription>
                                Automatically accept new reaction link requests for your videos.
                            </FieldDescription>
                        </FieldContent>
                        <Switch
                            checked={autoAccept}
                            onCheckedChange={handleToggle}
                            disabled={loading}
                            className="ml-auto"
                        />
                    </Field>
                </div>

                <div className="flex justify-end gap-2">
                    <Button onClick={onClose} variant="outline">Close</Button>
                </div>
            </div>
        </div>
    );
};
