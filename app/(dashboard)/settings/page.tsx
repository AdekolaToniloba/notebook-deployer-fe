"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Shield,
  Github,
  Unplug,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Save,
  X,
  Eye,
  Globe,
  Code,
  BookOpen,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiClient } from "@/lib/api/client";
import { handleError } from "@/lib/error-utils";
import { toasts } from "@/lib/toast-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserMetricsSection } from "@/components/settings/user-metrics-section";
import { BarChart3 } from "lucide-react";

// --- Types (Based on Schema) ---

interface ProfileData {
  id: number;
  username: string;
  email: string;
  bio: string | null;
  primary_stack: string | null;
  research_interests: string | null;
  is_profile_public: boolean;
  github_username: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ProfileUpdatePayload {
  bio?: string | null;
  primary_stack?: string | null;
  research_interests?: string | null;
  is_profile_public?: boolean;
}

interface PublicProfileStats {
  total_notebooks: number;
  total_deployments: number;
  active_deployments: number;
  total_models: number;
  avg_health_score: number;
}

interface PublicProfileResponse {
  username: string;
  bio: string | null;
  primary_stack: string | null;
  research_interests: string | null;
  github_username: string | null;
  created_at: string;
  stats: PublicProfileStats;
  notebooks: Array<{
    id: number;
    name: string;
    health_score: number | null;
    has_deployment: boolean;
    deployment_url: string | null;
    created_at: string;
  }>;
  deployments: Array<{
    id: number;
    name: string;
    notebook_name: string;
    service_url: string | null;
    status: string;
    deployed_at: string | null;
  }>;
}

// --- Shared UI Components ---

function SettingsCard({
  title,
  icon: Icon,
  children,
  color = "bg-white",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${color}`}
    >
      <div className="flex items-center gap-4 mb-6 border-b-2 border-black pb-4">
        <div className="p-2 bg-black text-white shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase break-words">
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

// --- Profile Section Component ---

function ProfileSection() {
  const { user } = useAuth(); // used for fallback/initial checks if needed
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [publicProfile, setPublicProfile] =
    useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ProfileUpdatePayload>({});

  const api = getApiClient();

  // 1. Fetch Profile Data
  const fetchProfile = async () => {
    try {
      const { data } = await api.get<ProfileData>("/api/v1/profile/me");
      setProfile(data);
      setFormData({
        bio: data.bio,
        primary_stack: data.primary_stack,
        research_interests: data.research_interests,
        is_profile_public: data.is_profile_public,
      });

      // If public, fetch public view to preview stats
      if (data.is_profile_public) {
        try {
          const pubRes = await api.get<PublicProfileResponse>(
            `/api/v1/profile/${data.username}/public`
          );
          setPublicProfile(pubRes.data);
        } catch (err) {
          console.warn("Could not fetch public profile preview", err);
        }
      } else {
        setPublicProfile(null);
      }
    } catch (error) {
      handleError(error, "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 2. Handle Update
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { data } = await api.put<ProfileData>(
        "/api/v1/profile/me",
        formData
      );
      setProfile(data);
      setIsEditing(false);
      toasts.general.success(
        "Profile Updated",
        "Your dossier has been updated."
      );

      // Refresh to get public stats sync if visibility changed
      fetchProfile();
    } catch (error) {
      handleError(error, "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const togglePublicVisibility = async () => {
    // Quick toggle without entering full edit mode
    if (!profile) return;
    const newValue = !profile.is_profile_public;
    // Optimistic update locally for UI feel
    setFormData((prev) => ({ ...prev, is_profile_public: newValue }));

    try {
      await api.put<ProfileData>("/api/v1/profile/me", {
        ...formData,
        is_profile_public: newValue,
      });
      setProfile((prev) =>
        prev ? { ...prev, is_profile_public: newValue } : null
      );

      if (newValue) {
        toasts.general.success(
          "Portfolio is Live",
          "Your profile is now public."
        );
        fetchProfile(); // Fetch the public stats
      } else {
        toasts.general.info("Portfolio Hidden", "Your profile is now private.");
        setPublicProfile(null);
      }
    } catch (error) {
      handleError(error, "Failed to toggle visibility");
      // Revert on error
      setFormData((prev) => ({
        ...prev,
        is_profile_public: profile.is_profile_public,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  if (!profile)
    return <div className="text-red-500 font-bold">Error loading profile.</div>;

  return (
    <div className="space-y-8">
      {/* Main Identity Card */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar / Identity */}
        <div className="flex-shrink-0 flex flex-col items-center gap-4">
          <div className="w-32 h-32 border-4 border-black bg-[#FFDE59] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-black text-5xl uppercase">
              {profile.username.slice(0, 2)}
            </span>
          </div>
          <div className="text-center">
            <div className="font-mono text-xs font-bold bg-black text-white px-2 py-1 mb-1 inline-block">
              ID: {profile.id}
            </div>
            <p className="text-xs font-bold text-gray-500">
              Member since {new Date(profile.created_at).getFullYear()}
            </p>
          </div>
        </div>

        {/* Details & Form */}
        <div className="flex-grow space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-black uppercase">
                {profile.username}
              </h3>
              <p className="font-mono text-sm text-gray-600">{profile.email}</p>
            </div>

            <Button
              onClick={() =>
                isEditing ? setIsEditing(false) : setIsEditing(true)
              }
              variant="ghost"
              className="border-2 border-transparent hover:border-black hover:bg-gray-100 rounded-none"
            >
              {isEditing ? (
                <X className="h-5 w-5" />
              ) : (
                <Edit3 className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="border-t-2 border-black my-4" />

          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4"
            >
              <div>
                <label className="block font-bold text-xs uppercase mb-1">
                  Professional Bio
                </label>
                <textarea
                  value={formData.bio || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full p-3 border-2 border-black font-mono text-sm focus:outline-none focus:bg-[#E0E7FF]"
                  rows={3}
                  maxLength={2000}
                  placeholder="Tell us about your engineering journey..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-xs uppercase mb-1 flex items-center gap-2">
                    <Code className="h-3 w-3" /> Primary Stack
                  </label>
                  <input
                    value={formData.primary_stack || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_stack: e.target.value,
                      })
                    }
                    className="w-full p-2 border-2 border-black font-mono text-sm focus:outline-none focus:bg-[#E0E7FF]"
                    placeholder="e.g. PyTorch, FastAPI, React"
                    maxLength={512}
                  />
                </div>
                <div>
                  <label className="block font-bold text-xs uppercase mb-1 flex items-center gap-2">
                    <BookOpen className="h-3 w-3" /> Research Interests
                  </label>
                  <input
                    value={formData.research_interests || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        research_interests: e.target.value,
                      })
                    }
                    className="w-full p-2 border-2 border-black font-mono text-sm focus:outline-none focus:bg-[#E0E7FF]"
                    placeholder="e.g. LLMs, Computer Vision"
                    maxLength={2000}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-black text-white rounded-none font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                  {saving ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  SAVE CHANGES
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 border-l-4 border-black">
                <p className="font-mono text-sm whitespace-pre-wrap italic text-gray-700">
                  {profile.bio || "No bio provided yet. Click edit to add one."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-black text-xs uppercase mb-1">
                    Primary Stack
                  </h4>
                  <p className="font-mono text-sm bg-white border border-gray-300 p-2">
                    {profile.primary_stack || "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="font-black text-xs uppercase mb-1">
                    Research Interests
                  </h4>
                  <p className="font-mono text-sm bg-white border border-gray-300 p-2">
                    {profile.research_interests || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Visibility Section */}
      <div className="border-t-4 border-black pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Globe
              className={`h-6 w-6 ${
                profile.is_profile_public ? "text-green-600" : "text-gray-400"
              }`}
            />
            <div>
              <h3 className="font-black uppercase text-lg">Public Portfolio</h3>
              <p className="text-xs font-bold text-gray-500">
                {profile.is_profile_public
                  ? "VISIBLE TO EVERYONE"
                  : "HIDDEN (PRIVATE)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={profile.is_profile_public}
                onChange={togglePublicVisibility}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none border-2 border-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              <span className="ml-3 text-xs font-black uppercase group-hover:underline">
                {profile.is_profile_public ? "ON" : "OFF"}
              </span>
            </label>
          </div>
        </div>

        {/* Public Preview Stats (Only if public) */}
        <AnimatePresence>
          {profile.is_profile_public && publicProfile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#E0E7FF] border-2 border-black p-6 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-black uppercase text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Live Preview Stats
                </h4>
                <LinkIcon className="h-4 w-4 opacity-50" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border-2 border-black p-3 text-center">
                  <div className="text-2xl font-black">
                    {publicProfile.stats.total_notebooks}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">
                    Notebooks
                  </div>
                </div>
                <div className="bg-white border-2 border-black p-3 text-center">
                  <div className="text-2xl font-black">
                    {publicProfile.stats.active_deployments}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-green-600">
                    Live Apps
                  </div>
                </div>
                <div className="bg-white border-2 border-black p-3 text-center">
                  <div className="text-2xl font-black">
                    {publicProfile.stats.total_models}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">
                    Models
                  </div>
                </div>
                <div className="bg-white border-2 border-black p-3 text-center">
                  <div className="text-2xl font-black">
                    {publicProfile.stats.avg_health_score.toFixed(0)}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">
                    Avg Health
                  </div>
                </div>
              </div>

              {publicProfile.deployments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/10">
                  <p className="text-xs font-bold uppercase mb-2">
                    Featured Deployments:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {publicProfile.deployments.map((d) => (
                      <a
                        key={d.id}
                        href={d.service_url || "#"}
                        target="_blank"
                        className="flex items-center gap-1 bg-white px-2 py-1 border border-black text-xs font-mono hover:bg-black hover:text-white transition-colors"
                      >
                        {d.name} <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Settings Page (Main) ---

interface GithubStatus {
  github_username: string | null;
  connected: boolean;
}

interface GithubScopesResponse {
  scopes: string[];
  has_repo_access: boolean;
  required_scopes: string[];
  needs_reauth: boolean;
}

export default function SettingsPage() {
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [isLoadingGithub, setIsLoadingGithub] = useState(true);
  const [scopes, setScopes] = useState<GithubScopesResponse | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  // 1. Status Check
  const checkGithubStatus = async () => {
    try {
      const api = getApiClient();
      const statusRes = await api.get<GithubStatus>("/api/v1/github/status");

      if (statusRes.data.connected) {
        setIsGithubConnected(true);
        setGithubUsername(statusRes.data.github_username);

        // Fetch scopes if connected
        try {
          const scopesRes = await api.get<GithubScopesResponse>(
            "/api/v1/github/scopes"
          );
          setScopes(scopesRes.data);
        } catch (scopeErr) {
          console.error("Failed to fetch scopes", scopeErr);
        }
        return true;
      } else {
        setIsGithubConnected(false);
        setGithubUsername(null);
        setScopes(null);
        return false;
      }
    } catch (error) {
      console.error("Status check failed", error);
      setIsGithubConnected(false);
      return false;
    }
  };

  useEffect(() => {
    checkGithubStatus().finally(() => setIsLoadingGithub(false));
  }, []);

  const [webhookLoading, setWebhookLoading] = useState(false);

  const handleSetupWebhook = async () => {
    try {
      setWebhookLoading(true);
      const api = getApiClient();
      // Assuming this endpoint exists to auto-configure the repo hook
      await api.post("/api/v1/github/webhooks/setup");
      toasts.general.success(
        "Webhooks Configured",
        "Auto-deployments are now active."
      );
    } catch (error) {
      handleError(error, "Failed to setup webhooks");
    } finally {
      setWebhookLoading(false);
    }
  };

  // 2. Connect Flow
  const handleConnectGithub = async () => {
    try {
      setIsLoadingGithub(true);
      const api = getApiClient();
      const response = await api.get<{ url: string }>(
        "/api/v1/github/oauth/authorize"
      );

      if (response.data && response.data.url) {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          response.data.url,
          "Connect GitHub",
          `width=${width},height=${height},top=${top},left=${left}`
        );

        const timer = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(timer);
            setIsLoadingGithub(false);
            await checkGithubStatus();
          } else {
            const isConnected = await checkGithubStatus();
            if (isConnected) {
              clearInterval(timer);
              popup?.close();
              setIsLoadingGithub(false);
            }
          }
        }, 2000);
      }
    } catch (error) {
      handleError(error, "Failed to start GitHub connection");
      setIsLoadingGithub(false);
    }
  };

  // 3. Disconnect
  const handleDisconnectGithub = async () => {
    try {
      setDisconnectLoading(true);
      const api = getApiClient();
      await api.post("/api/v1/github/disconnect");
      setIsGithubConnected(false);
      setGithubUsername(null);
      setScopes(null);
    } catch (error) {
      handleError(error, "Failed to disconnect");
    } finally {
      setDisconnectLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 md:space-y-12 font-mono min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-5xl font-black uppercase mb-2 break-words">
          Settings
        </h1>
        <p className="text-gray-500 font-bold text-sm md:text-base">
          MANAGE YOUR PREFERENCES & INTEGRATIONS
        </p>
      </motion.div>

      {/* Profile Section - Replaces old ProfileForm */}
      <SettingsCard
        title="Professional Profile"
        icon={Shield}
        color="bg-[#F3E8FF]"
      >
        {" "}
        {/* Lavender BG */}
        <ProfileSection />
      </SettingsCard>

      {/* Metrics Section - NEW */}
      <SettingsCard
        title="Performance Analytics"
        icon={BarChart3}
        color="bg-[#FFEDD5]" // Light Orange
      >
        <UserMetricsSection />
      </SettingsCard>

      {/* GitHub Card */}
      <SettingsCard
        title="GitHub Integration"
        icon={Github}
        color="bg-[#B6DFFF]"
      >
        {isLoadingGithub ? (
          <div className="flex items-center gap-2 font-bold">
            <Loader2 className="animate-spin h-5 w-5" />
            {isGithubConnected ? "SYNCING DATA..." : "CONNECTING..."}
          </div>
        ) : isGithubConnected ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 bg-green-100 p-4 border-2 border-black break-all">
              <div className="flex items-center gap-2 text-green-700 font-black">
                <CheckCircle2 className="h-6 w-6 flex-shrink-0" />
                <span className="truncate">
                  CONNECTED AS {githubUsername?.toUpperCase()}
                </span>
              </div>

              <div className="pt-4 border-t-2 border-black mt-4">
                <h4 className="font-black text-sm uppercase mb-2">
                  Automation
                </h4>
                <div className="flex items-center justify-between bg-gray-50 p-3 border-2 border-black">
                  <div>
                    <p className="font-bold text-sm">Auto-Deploy (Webhooks)</p>
                    <p className="text-xs text-gray-500">
                      Trigger builds on git push
                    </p>
                  </div>
                  <Button
                    onClick={handleSetupWebhook}
                    disabled={webhookLoading}
                    size="sm"
                    className="rounded-none font-bold border-2 border-black bg-white text-black hover:bg-[#FFDE59]"
                  >
                    {webhookLoading ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      "CONFIGURE"
                    )}
                  </Button>
                </div>
              </div>

              {/* Scopes Display */}
              {scopes && (
                <div className="mt-2 pt-2 border-t-2 border-green-200 text-xs text-green-800 font-bold">
                  <div className="mb-1">PERMISSIONS:</div>
                  <div className="flex flex-wrap gap-2">
                    {scopes.scopes.map((scope) => (
                      <span
                        key={scope}
                        className="bg-white px-2 py-1 border border-green-600"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                  {scopes.needs_reauth && (
                    <div className="mt-2 text-red-600 animate-pulse flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> RE-AUTHENTICATION
                      REQUIRED
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white border-2 border-black p-4 opacity-50">
              <p className="text-gray-500 text-sm italic font-bold">
                Repository list temporarily unavailable.
              </p>
            </div>

            {/* Disconnect Button with Alert Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={disconnectLoading}
                  className="w-full md:w-auto bg-red-600 text-white border-2 border-black hover:bg-red-700 rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all"
                >
                  {disconnectLoading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Unplug className="mr-2 h-4 w-4" />
                  )}
                  DISCONNECT ACCOUNT
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-none p-6 max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono font-black uppercase text-xl">
                    Disconnect GitHub?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-mono text-gray-600 font-medium">
                    This will disconnect your GitHub account and stop automatic
                    deployments from your repositories. Existing deployments
                    will remain active.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 gap-3">
                  <AlertDialogCancel className="font-mono font-bold border-2 border-black rounded-none hover:bg-gray-100 mt-0">
                    CANCEL
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisconnectGithub}
                    className="font-mono font-bold bg-red-600 text-white border-2 border-black rounded-none hover:bg-red-700"
                  >
                    YES, DISCONNECT
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-bold text-gray-700">
              Connect your GitHub account to enable automatic deployments.
            </p>
            <Button
              onClick={handleConnectGithub}
              className="w-full md:w-auto bg-black text-white border-2 border-transparent hover:bg-white hover:text-black hover:border-black rounded-none font-bold h-12 px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all"
            >
              <Github className="mr-2 h-5 w-5" /> CONNECT GITHUB
            </Button>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
