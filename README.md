# Aether | Cloud Notebook Deployment

> **Turn your Jupyter Notebooks into scalable production APIs in seconds.**

Aether bridges the gap between Data Science and DevOps. It allows users to upload standard `.ipynb` files, automatically containerizes them, and deploys them as secure, scalable REST APIs on Google Cloud Run—all through a high-contrast, brutalist interface.

![Aether Dashboard Screenshot](https://via.placeholder.com/1200x600?text=Aether+Dashboard+Preview) 

## 🚀 Key Features

*   **One-Click Deployment:** Upload a `.ipynb` file and get a live HTTPS endpoint.
*   **Real-Time Build Telemetry:** Live streaming of Docker build logs via WebSockets.
*   **Model Registry:** Manage multiple versions of machine learning artifacts per deployment.
*   **Hot Reloading:** Update models in production without downtime.
*   **Interactive Documentation:** Auto-generated Swagger UI for every deployed API.
*   **Proactive Security:** JWT-based authentication with intelligent token rotation and proactive refresh scheduling.
*   **Brutalist UI:** A distinct, high-contrast design system built with Tailwind CSS and Framer Motion.

## 🛠️ Tech Stack

**Core Framework**
*   [Next.js 14](https://nextjs.org/) (App Router)
*   [TypeScript](https://www.typescriptlang.org/)
*   [React 18](https://react.dev/)

**Styling & UI**
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Framer Motion](https://www.framer.com/motion/) (Animations)
*   [Shadcn/ui](https://ui.shadcn.com/) (Component Primitives)
*   [Lucide React](https://lucide.dev/) (Icons)

**State & Data**
*   [Zustand](https://github.com/pmndrs/zustand) (Global Store)
*   [Axios](https://axios-http.com/) (Networking with Interceptors)
*   [Zod](https://zod.dev/) (Schema Validation)
*   [React Hook Form](https://react-hook-form.com/)

## ⚡ Getting Started

### Prerequisites

*   Node.js 18.17 or later
*   npm or yarn or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/AdekolaToniloba/notebook-deployer-fe.git
    cd notebook-deployer-fe
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment**
    Create a `.env.local` file in the root directory. You can copy the example configuration:
    ```bash
    cp .env.example .env.local
    ```

    **Required Variables:**
    ```env
    # The URL of the backend REST API
    NEXT_PUBLIC_API_URL=https://your-backend-api.run.app

    # The URL for WebSocket connections (usually same host, wss:// protocol)
    NEXT_PUBLIC_WS_URL=wss://your-backend-api.run.app
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Architecture Highlights

### Proactive Authentication Strategy
Unlike standard auth implementations that wait for a 401 error to refresh tokens, Aether uses a **proactive scheduler**.
*   It calculates the exact expiry time of the JWT.
*   It schedules a refresh 60 seconds *before* expiry.
*   It handles tab focus events to instantly refresh stale tokens when a user returns to the app after inactivity.

### WebSocket Log Streaming
The deployment logs are streamed in real-time to provide immediate feedback during the containerization process.
*   **Protocol:** Secure WebSockets (`wss://`).
*   **Resilience:** Automatic reconnection logic if the stream is interrupted.
*   **Fallback:** If the stream fails, the UI gracefully falls back to REST-based polling.

## 📂 Project Structure

```bash
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Login/Register routes
│   ├── (dashboard)/      # Main app interface (Deployments, Notebooks)
│   └── layout.tsx        # Root layout & providers
├── components/           # React components
│   ├── ui/               # Reusable primitives (buttons, dialogs)
│   ├── features/         # Domain-specific components (ModelManager, etc.)
│   └── deployments/      # Deployment-specific widgets (LogTerminal)
├── lib/                  # Utilities & Logic
│   ├── api/              # API services & Axios client
│   ├── auth/             # Token management logic
│   ├── hooks/            # Custom React hooks (useDeploymentLogs)
│   └── stores/           # Zustand state stores
└── types/                # TypeScript definitions


🤝 Contributing
Contributions are welcome! Please follow these steps:

Fork the repository.

Create a feature branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📄 License
Distributed under the MIT License. See LICENSE for more information.

Built by Toniloba Adekola & Ifihanagbara Olusheye
