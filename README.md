# 🛣️ Namma Bengaluru Clean: CivicLens AI

**Namma Bengaluru Clean** (powered by CivicLens) is an AI-driven civic engagement platform designed to help citizens report and track public infrastructure issues like **potholes** and **garbage piles** in real-time. 

Built for the BBMP (Bruhat Bengaluru Mahanagara Palike), this platform uses state-of-the-art **NVIDIA Vision AI** to automatically verify reports, ensuring high-quality data for urban planning and administrative response.

![Dashboard Preview](https://github.com/Shamanth-001/PotholeDetection/raw/main/screenshot.png)

## 🚀 Key Features

- **AI-Powered Verification**: Uses NVIDIA's LLaMA 3.2 Vision and YOLO-World models to automatically detect and classify potholes/garbage from citizen-uploaded photos.
- **Smart Duplicate Detection**: Automatically identifies reports within a 10m radius to prevent redundant data and encourage community upvoting.
- **Gamified Rewards**: Citizens earn "Impact Points" for reporting valid issues and upvoting community-verified reports.
- **Spatial Heatmaps**: Administrative dashboard with PostGIS-powered heatmaps to visualize high-urgency zones.
- **Real-time Map View**: Interactive Leaflet-based map for citizens to browse reported issues across Bengaluru.

## 🛠️ Technology Stack

- **Frontend**: React.js, Tailwind CSS, Leaflet, Lucide Icons, React Hot Toast.
- **Backend**: Node.js, Express.js, PostgreSQL with PostGIS (Spatial Database).
- **AI Microservice**: Python (FastAPI), NVIDIA NIM (LLaMA 3.2 Vision / YOLO-World).
- **Deployment**: Docker, Docker Compose.

## 📦 Project Structure

```bash
├── ai-service/          # Python FastAPI service for NVIDIA Vision AI integration
├── backend/             # Node.js/Express API with PostGIS spatial logic
├── frontend/            # React/Vite dashboard and map interface
├── docker-compose.yml   # Full-stack orchestration
└── .env                 # Environment configuration (Template provided)
```

## ⚙️ Getting Started

### 1. Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/)
- [NVIDIA API Key](https://build.nvidia.com/nvidia/llama-3_2-11b-vision-instruct)

### 2. Configuration
Create a `.env` file in the root directory:
```env
# Database
DB_PASSWORD=your_secure_password
DATABASE_URL=postgres://civiclens_user:your_secure_password@localhost:5432/civiclens

# NVIDIA API
NVIDIA_API_KEY=your_nvapi_key_here

# AI Configuration
CONFIDENCE_THRESHOLD=0.7
MOCK_MODE=false
```

### 3. Launch
Run the entire stack with a single command:
```bash
docker compose up --build
```
The platform will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- AI Microservice: `http://localhost:8000`

## 🛡️ AI Verification Workflow
CivicLens uses a multi-tier verification process:
1. **Zero-Shot Detection**: The system queries NVIDIA's Vision LLM to verify if the uploaded image contains a pothole or garbage.
2. **Auto-Rejection**: Irrelevant images (spam, indoor photos) are instantly rejected by the AI filter.
3. **Crowdsourced Confirmation**: Nearby reports trigger a "Duplicate Detected" flow, allowing other citizens to upvote and confirm the issue, which transitions the report to `under_review` for BBMP admins.

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Made with ❤️ for Bengaluru.*
