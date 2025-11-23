"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { useAuth } from "@/lib/hooks/use-auth";
import { Shield, Github, Unplug, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiClient } from "@/lib/api/client";
import { handleError } from "@/lib/error-utils";

// --- Types ---
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

// --- SettingsCard Component ---
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
      className={`border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${color}`}
    >
      <div className="flex items-center gap-4 mb-6 border-b-2 border-black pb-4">
        <div className="p-2 bg-black text-white">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-black uppercase">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [isLoadingGithub, setIsLoadingGithub] = useState(true);
  const [scopes, setScopes] = useState<GithubScopesResponse | null>(null);

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
      // error variable was unused, now we use it implicitly or handle it
      console.error("Status check failed", error);
      setIsGithubConnected(false);
      return false;
    }
  };

  useEffect(() => {
    checkGithubStatus().finally(() => setIsLoadingGithub(false));
  }, []);

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
    if (!confirm("Are you sure you want to disconnect GitHub?")) return;

    try {
      setIsLoadingGithub(true);
      const api = getApiClient();
      await api.post("/api/v1/github/disconnect");
      setIsGithubConnected(false);
      setGithubUsername(null);
      setScopes(null);
    } catch (error) {
      handleError(error, "Failed to disconnect");
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const userData = {
    name: user?.username || "User",
    email: user?.email || "user@example.com",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 font-mono">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-5xl font-black uppercase mb-2">Settings</h1>
        <p className="text-gray-500 font-bold">
          MANAGE YOUR PREFERENCES & INTEGRATIONS
        </p>
      </motion.div>

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
            <div className="flex flex-col gap-2 bg-green-100 p-4 border-2 border-black">
              <div className="flex items-center gap-2 text-green-700 font-black">
                <CheckCircle2 className="h-6 w-6" />
                CONNECTED AS {githubUsername?.toUpperCase()}
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
                    <div className="mt-2 text-red-600 animate-pulse">
                      ⚠️ RE-AUTHENTICATION REQUIRED
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

            <Button
              onClick={handleDisconnectGithub}
              className="bg-red-600 text-white border-2 border-black hover:bg-red-700 rounded-none font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all"
            >
              <Unplug className="mr-2 h-4 w-4" /> DISCONNECT ACCOUNT
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-bold text-gray-700">
              Connect your GitHub account to enable automatic deployments.
            </p>
            <Button
              onClick={handleConnectGithub}
              className="bg-black text-white border-2 border-transparent hover:bg-white hover:text-black hover:border-black rounded-none font-bold h-12 px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all"
            >
              <Github className="mr-2 h-5 w-5" /> CONNECT GITHUB
            </Button>
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Profile" icon={Shield}>
        <ProfileForm initialData={userData} />
      </SettingsCard>
    </div>
  );
}
