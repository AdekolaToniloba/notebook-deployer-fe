"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { getApiClient } from "@/lib/api/client";
import { toasts } from "@/lib/toast-utils";

// Define error type interface
interface AuthError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export default function GithubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code || !state) {
        setStatus("error");
        toasts.general.error(
          "Invalid Callback",
          "Missing code or state parameter."
        );
        setTimeout(() => router.push("/settings"), 2000);
        return;
      }

      try {
        const api = getApiClient();
        await api.get(
          `/api/v1/github/oauth/callback?code=${code}&state=${state}`
        );

        setStatus("success");
        toasts.general.success(
          "GitHub Connected",
          "Your account has been successfully linked."
        );

        setTimeout(() => router.push("/settings"), 1500);
      } catch (err: unknown) {
        // FIX: Use 'unknown' and cast to defined interface
        const error = err as AuthError;

        console.error("OAuth Error:", error);
        setStatus("error");

        const msg =
          error.response?.data?.detail ||
          error.message ||
          "Failed to complete authentication.";
        toasts.general.error("Connection Failed", msg);

        setTimeout(() => router.push("/settings"), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f0] font-mono">
      <div className="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center">
        {status === "processing" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase">Authorizing...</h2>
            <p className="text-sm font-bold text-gray-500 mt-2">
              Completing handshake with GitHub.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-600 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black uppercase text-green-600">
              Connected!
            </h2>
            <p className="text-sm font-bold text-gray-500 mt-2">
              Redirecting to settings...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-600 text-red-600">
              <XCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black uppercase text-red-600">
              Auth Failed
            </h2>
            <p className="text-sm font-bold text-gray-500 mt-2">
              Please try again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
