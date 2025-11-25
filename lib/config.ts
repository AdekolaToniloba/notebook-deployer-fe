// lib/config.ts

export const APP_CONFIG = {
  API_URL: "https://codematics-be-860155021919.us-central1.run.app",
  APP_NAME: "Aether",
  APP_URL: "https://aether-860155021919.us-central1.run.app",

  // Helper getter for WebSocket URL (handles wss vs ws automatically)
  get WS_URL() {
    const protocol = this.API_URL.startsWith("https") ? "wss:" : "ws:";
    const host = this.API_URL.replace(/^https?:\/\//, "");
    return `${protocol}//${host}`;
  },
} as const;
