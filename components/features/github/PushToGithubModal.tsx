"use client";

import { useState } from "react";
import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Github, Loader2, GitBranch } from "lucide-react";
import { githubService } from "@/lib/api/services/github.service";
import { toasts } from "@/lib/toast-utils";

interface PushToGithubModalProps {
  notebookId: number;
  notebookName: string;
}

// Shape of error from Axios/FastAPI
interface ApiError {
  response?: {
    data?: {
      detail?: string | { msg: string }[];
    };
  };
  message?: string;
}

export function PushToGithubModal({
  notebookId,
  notebookName,
}: PushToGithubModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [repoName, setRepoName] = useState(
    notebookName.toLowerCase().replace(/\s+/g, "-")
  );
  const [description, setDescription] = useState(
    `Deployment repository for ${notebookName}`
  );
  const [isPrivate, setIsPrivate] = useState(true);

  const getErrorMessage = (error: unknown): string => {
    const err = error as ApiError;
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    return err.message || "An unknown error occurred.";
  };

  const handlePush = async () => {
    if (!repoName.trim()) return;

    setIsLoading(true);
    try {
      const result = await githubService.createRepo({
        notebook_id: notebookId,
        repo_name: repoName,
        description,
        private: isPrivate,
      });

      toasts.general.success(
        "Repository Created",
        `Pushed to ${result.repo_name}`
      );
      setIsOpen(false);
      window.open(result.repo_url, "_blank");
    } catch (error: unknown) {
      const msg = getErrorMessage(error);
      toasts.general.error("GitHub Push Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setRepoName(e.target.value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setDescription(e.target.value);
  };

  const handlePrivateChange = (checked: boolean): void => {
    setIsPrivate(checked);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full justify-start border-2 border-black bg-white text-black hover:bg-[#B6DFFF] rounded-none font-mono font-bold">
          <Github className="mr-2 h-4 w-4" /> PUSH TO GITHUB
        </Button>
      </DialogTrigger>

      <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl font-black uppercase flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Push to GitHub
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="repo-name" className="font-mono font-bold">
              REPO NAME
            </Label>
            <Input
              id="repo-name"
              value={repoName}
              onChange={handleRepoNameChange}
              className="font-mono border-2 border-black rounded-none focus:ring-0"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="repo-desc" className="font-mono font-bold">
              DESCRIPTION
            </Label>
            <Textarea
              id="repo-desc"
              value={description}
              onChange={handleDescriptionChange}
              className="font-mono border-2 border-black rounded-none focus:ring-0 resize-none"
            />
          </div>

          <div className="flex items-center justify-between border-2 border-black p-3 bg-gray-50">
            <Label
              htmlFor="repo-private"
              className="font-mono font-bold cursor-pointer"
            >
              PRIVATE REPO
            </Label>
            <Switch
              id="repo-private"
              checked={isPrivate}
              onCheckedChange={handlePrivateChange}
            />
          </div>
        </div>

        <Button
          onClick={handlePush}
          disabled={isLoading || !repoName.trim()}
          className="w-full border-2 border-black bg-[#FFDE59] text-black hover:bg-[#ffe580] font-mono font-bold rounded-none h-12"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> PUSHING...
            </>
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" /> CREATE & PUSH
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
