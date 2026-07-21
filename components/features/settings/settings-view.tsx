"use client";

import { updateProfile, uploadAvatar } from "@/lib/actions/platform";
import { updateCompatibilityMetadata } from "@/lib/actions/identity";
import { updatePassword } from "@/lib/actions/auth";
import { BillingSettings } from "@/engines/billing";
import type { BillingSummary } from "@/lib/actions/billing";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FeatureScreen,
  Input,
  Label,
  Separator,
  Tabs,
  Textarea,
  useToast,
} from "@/systems/design-system";
import { formatInitials } from "@/lib/format";
import type { UserProfile } from "@/types/database.types";
import type { ProfileCompatibility } from "@/lib/data/profile";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export function SettingsView({
  profile,
  billing,
  compatibility,
}: {
  profile: UserProfile;
  billing: BillingSummary;
  compatibility: ProfileCompatibility;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const initialSettingsTab = searchParams.get("tab");
  const [tab, setTab] = useState(
    initialSettingsTab === "profile" || initialSettingsTab === "billing"
      ? initialSettingsTab
      : "account"
  );
  const [isSaving, startSaveTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [isUpdatingPassword, startPasswordTransition] = useTransition();
  const showPasswordReset = searchParams.get("recovery") === "1";

  useEffect(() => {
    const settingsTab = searchParams.get("tab");
    if (settingsTab === "profile" || settingsTab === "billing") {
      setTab(settingsTab);
    }
  }, [searchParams]);

  const saveCompatibility = (formData: FormData) => {
    startSaveTransition(async () => {
      const result = await updateCompatibilityMetadata({
        skills: formData.get("skills") as string,
        interests: formData.get("interests") as string,
        strengths: formData.get("strengths") as string,
        values: formData.get("values") as string,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Compatibility profile saved", "success");
        router.refresh();
      }
    });
  };

  const listToInput = (items: string[]) => items.join(", ");

  const saveAccount = (formData: FormData) => {
    startSaveTransition(async () => {
      const result = await updateProfile({
        full_name: formData.get("full_name") as string,
        role: formData.get("role") as string,
        location: formData.get("location") as string,
        bio: formData.get("bio") as string,
        build_vision: formData.get("build_vision") as string,
      });
      if (result.error) toast(result.error, "error");
      else {
        toast("Settings saved", "success");
        router.refresh();
      }
    });
  };

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("avatar", file);
    startUploadTransition(async () => {
      const result = await uploadAvatar(formData);
      if (result.error) toast(result.error, "error");
      else {
        toast("Avatar updated", "success");
        router.refresh();
      }
    });
  };

  const handlePasswordUpdate = (formData: FormData) => {
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;
    if (password !== confirm) {
      toast("Passwords do not match", "error");
      return;
    }
    startPasswordTransition(async () => {
      const result = await updatePassword(password);
      if (result.error) toast(result.error, "error");
      else {
        toast("Password updated", "success");
        router.replace("/settings");
      }
    });
  };

  return (
    <FeatureScreen
      label="Settings"
      title="Settings"
      description="Manage your account and preferences."
      toolbar={
        <Tabs
          className="w-fit"
          tabs={[
            { id: "account", label: "Account" },
            { id: "profile", label: "Profile" },
            { id: "billing", label: "Billing" },
          ]}
          active={tab}
          onChange={setTab}
        />
      }
    >
      <div className="mx-auto max-w-3xl">
        {tab === "account" && (
          <div className="space-y-6">
            {showPasswordReset && (
              <Card className="border-brand/30">
                <CardHeader>
                  <CardTitle>Set a new password</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-fg-secondary">
                    Choose a new password for your account, then continue using BELONG.
                  </p>
                  <form action={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        minLength={8}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm password</Label>
                      <Input
                        id="confirm"
                        name="confirm"
                        type="password"
                        minLength={8}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <Button type="submit" isLoading={isUpdatingPassword}>
                      Update password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Account information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center gap-4">
                  <Avatar
                    src={profile.avatar_url ?? undefined}
                    fallback={formatInitials(profile.full_name)}
                    size="lg"
                  />
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatar}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isUploading}
                      isLoading={isUploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      Upload photo
                    </Button>
                  </div>
                </div>
                <form action={saveAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      defaultValue={profile.full_name ?? ""}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" name="role" defaultValue={profile.role ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={profile.email} disabled />
                  </div>
                  <Button type="submit" isLoading={isSaving}>
                    Save changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "profile" && (
          <Card>
            <CardHeader>
              <CardTitle>Public profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={profile.location ?? ""}
                    placeholder="City, Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile.bio ?? ""}
                    placeholder="Tell builders about yourself"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="build_vision">Mission / vision</Label>
                  <Textarea
                    id="build_vision"
                    name="build_vision"
                    defaultValue={profile.build_vision ?? ""}
                    placeholder="What are you building?"
                  />
                </div>
                <input type="hidden" name="full_name" value={profile.full_name ?? ""} />
                <input type="hidden" name="role" value={profile.role ?? ""} />
                <Button type="submit" isLoading={isSaving}>
                  Save profile
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-fg-primary">Compatibility metadata</h3>
                  <p className="mt-1 text-caption text-fg-muted">
                    Used by the Opportunity Engine to match you with people, projects, communities,
                    and organizations. Separate items with commas.
                  </p>
                </div>
                <form action={saveCompatibility} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills</Label>
                    <Textarea
                      id="skills"
                      name="skills"
                      defaultValue={listToInput(compatibility.skills)}
                      placeholder="Product Management, Figma, TypeScript"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests</Label>
                    <Textarea
                      id="interests"
                      name="interests"
                      defaultValue={listToInput(compatibility.interests)}
                      placeholder="Startups, AI tools, Climate"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="strengths">Strengths</Label>
                    <Textarea
                      id="strengths"
                      name="strengths"
                      defaultValue={listToInput(compatibility.strengths)}
                      placeholder="Community building, Strategy"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="values">Values</Label>
                    <Textarea
                      id="values"
                      name="values"
                      defaultValue={listToInput(compatibility.values)}
                      placeholder="Impact, Integrity, Curiosity"
                      rows={2}
                    />
                  </div>
                  <Button type="submit" variant="secondary" isLoading={isSaving}>
                    Save compatibility metadata
                  </Button>
                </form>
              </div>

              <Separator className="my-6" />
              <p className="text-sm text-fg-muted">
                Profile data is stored in Supabase and visible to other BELONG members.
              </p>
            </CardContent>
          </Card>
        )}

        {tab === "billing" && <BillingSettings summary={billing} />}
      </div>
    </FeatureScreen>
  );
}
