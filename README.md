# Aurora

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Bun](https://img.shields.io/badge/Runtime-Bun-f472b6)

Aurora is a modern, real-time communication platform built for seamless interaction. Inspired by Discord, it combines instant messaging, voice notes, file sharing, and AI-powered assistance into a cohesive, responsive web application.

---

## 🌟 Features

### Core Communication
-   **Real-time Messaging**: Instant delivery powered by WebSockets.
-   **Direct Messages (DMs)**: Private, end-to-end encrypted conversations.
-   **Group Channels**: Create servers and topic-based channels for community discussions.
-   **File Sharing**: Upload and share images (`.png`, `.jpg`) and files securely via Supabase Storage.
-   **Voice Messaging**: Record and send voice notes directly within the chat interface.
-   **Emoji Picker**: Integrated emoji support for expressive communication.

### AI Integration
-   **Aurora AI**: Chat with a Google Gemini-powered AI assistant.
-   **Contextual Awareness**: The AI retains conversation history for natural, flowing interactions.

### Social & Presence
-   **User Presence**: Real-time online/offline status indicators.
-   **Profile Customization**: Personalize your identity with avatars, custom statuses, and bio.
-   **User Discovery**: Search and connect with other users in the global directory.

---

## 🛠️ Tech Stack

-   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
-   **Backend**: Node.js, Custom WebSocket Server
-   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
-   **Authentication**: Supabase Auth (Email/Password, Magic Links)
-   **Storage**: Supabase Storage
-   **AI**: Google Gemini Pro API
-   **Runtime**: [Bun](https://bun.sh/)

---

## 🏗️ Architecture & Remote Access

To enable robust testing on mobile and external devices using the **Ngrok Free Tier** (which limits users to a single concurrent tunnel), Aurora employs a custom port-forwarding architecture:

1.  **Frontend**: Runs on **Port 3000** (Exposed via Ngrok).
2.  **Backend (WebSocket)**: Runs on **Port 3002** (Internal/Localhost).
3.  **Proxying**: Next.js is configured to proxy all `/api/socket` requests from the frontend to the backend (`localhost:3002`).

This architecture allows a **single public URL** (`https://your-ngrok-url.ngrok-free.app`) to handle both the web interface and the real-time WebSocket connection, bypassing Ngrok's free tier limitations.

---

## 🚀 Getting Started

### Prerequisites
-   [Bun](https://bun.sh/) installed.
-   [Supabase](https://supabase.com/) project set up (Database, Auth, Storage).
-   [Google AI Studio](https://aistudio.google.com/) API Key.

### Environment Setup

⚠️ **Security Warning**: Never commit files containing real credentials (`.env`, `.env.local`, `apps/server/.env`) to version control. These files are gitignored for your protection.

Aurora uses environment variables for configuration. Follow these steps to set up your environment:

#### 1. Copy Example Files

The repository includes `.env.example` template files. Copy them to create your local environment files:

```bash
# Copy root environment example
cp .env.example .env

# Copy server environment example
cp apps/server/.env.example apps/server/.env

# Copy web environment example  
cp apps/web/.env.example apps/web/.env.local
```

#### 2. Configure Credentials

Open each `.env` file and replace the placeholder values with your actual credentials:

**Root `.env`** (or use individual app .env files):
```bash
# Get these from your Supabase project: Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # ⚠️ SENSITIVE

# WebSocket configuration (default values work for local development)
WS_PORT=3002
WS_HOST=localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3002

# Generate a secure secret (32+ characters):
# Use: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_secure_jwt_secret_min_32_chars  # ⚠️ SENSITIVE

# File upload limits (defaults shown)
MAX_FILE_SIZE=5368709120
UPLOAD_CHUNK_SIZE=5242880

# Google AI API Key (for Aurora AI assistant)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key  # ⚠️ SENSITIVE
```

**Important Notes:**
- Variables marked with ⚠️ are sensitive and should never be shared or committed
- The `NEXT_PUBLIC_*` variables are safe to expose in the browser
- Port 3002 is standardized for the WebSocket server
- For remote access via Ngrok, update `NEXT_PUBLIC_APP_URL` to your Ngrok URL

### Running Locally

1.  **Start the Backend Server**:
    ```bash
    cd apps/server
    bun run dev
    ```

2.  **Start the Frontend Application**:
    ```bash
    cd apps/web
    bun run dev
    ```

3.  **Access the App**:
    -   **Local**: Open `http://localhost:3000`.
    -   **Remote (Ngrok)**:
        ```bash
        ngrok http 3000
        ```
        Share the generated URL to test on other devices.

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
