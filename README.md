# AMR Prediction & Surveillance Web App

A full-stack web application for predicting and monitoring Antimicrobial Resistance (AMR) patterns using Deep Learning. It provides a comprehensive interface for AMR predictions, electronic prescription generation and interactive regional surveillance; built with React (Vite), FastAPI, and MongoDB.

## Project Structure

```
FYP_Project/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Prediction.jsx      # AMR Prediction page
│   │   │   ├── Surveillance.jsx    # Surveillance dashboard
│   │   │   └── EPrescription.jsx   # E-Prescription module
│   │   ├── components/    # Reusable components
│   │   │   ├── AntibioticSuggestionList.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── FileDrop.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── IconButton.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── OrganismDistributionChart.jsx
│   │   │   ├── PakistanMap.jsx
│   │   │   ├── PrescriptionForm.jsx
│   │   │   ├── PrescriptionSummary.jsx
│   │   │   ├── RegionDetailsPanel.jsx
│   │   │   └── ResistanceTrendsChart.jsx
│   │   ├── theme/         # Theme configuration
│   │   │   └── ThemeProvider.jsx
│   │   ├── App.jsx        # Main app component with routing
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── nginx.conf
├── server/                 # FastAPI backend
│   ├── main.py            # FastAPI application & API routes
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile
│   └── models/            # ML models directory
├── docker-compose.yml     # Docker orchestration
├── env.example            # Environment variables template
└── README.md
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- (Optional) Node.js 18+ and Python 3.10+ for local development

### Running with Docker (Recommended – one command for frontend, backend, and MongoDB)

1. **Clone and navigate to the project root:**
   ```bash
   cd PathoShield
   ```

2. **Set up environment variables (used by all services):**
   ```bash
   cp env.example .env
   ```
   Edit `.env` and update the values as needed (especially `MONGODB_URI` and `SECRET_KEY` for production).

3. **Build and start all services (MongoDB, FastAPI backend, React frontend) with a single command:**
   ```bash
   docker-compose up --build
   ```
   This will:
   - Start **MongoDB** on port **27017**
   - Start the **FastAPI backend** on port **8000**
   - Start the **React frontend** on port **5173**

4. **Access the application in your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - MongoDB: localhost:27017

### Running Locally (Development)

#### Frontend (React)

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at http://localhost:5173

#### Backend (FastAPI)

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables:**
   Create a `.env` file in the `server/` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/
   DB_NAME=amr_db
   MODEL_PATH=./models
   SECRET_KEY=your-secret-key
   ```

5. **Start the server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   Backend will be available at http://localhost:8000

#### MongoDB

Run MongoDB locally or use Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

## Testing

### Test Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Backend is running",
  "database": "connected"
}
```

### Test Frontend Connection

Open http://localhost:5173 in your browser. The status card should show "Backend is healthy" if the connection is successful.

## API Endpoints

### Health Check
- `GET /health` - Check backend and database status

### Predictions
- `POST /api/prediction/run` - Run AMR prediction (requires MALDI-TOF spectrum file + organism name)
  - Input: Multipart form data with:
    - `file`: Mass spectrometry data file (6000-dim spectrum, CSV or text format)
    - `organism`: Bacterial species name (e.g., "E. coli", "S. aureus")
    - `patientAge`: (Optional) Patient age
    - `patientGender`: (Optional) Patient gender
    - `region`: (Optional) Geographic region
  - Output: Prediction results with susceptible/resistant antibiotics and confidence score
  - Uses Hugging Face deployed model: https://hasaan77-amr-prediction.hf.space/

### Surveillance
- `GET /api/surveillance` - Get surveillance data
- `GET /api/surveillance/regions` - Get regional surveillance data with geographic coordinates
- `GET /api/surveillance/trends` - Get resistance trends over time (12 months)
- `GET /api/surveillance/organisms` - Get organism distribution data (4 species)

### API Documentation
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://mongodb:27017/`)
- `DB_NAME`: Database name (default: `amr_db`)
- `MODEL_PATH`: Path to ML model files (default: `/app/models`)
- `HF_API_URL`: Hugging Face model API URL (default: `https://hasaan77-amr-prediction.hf.space`)
- `SECRET_KEY`: Secret key for security (change in production!)
- `VITE_API_URL`: Frontend API URL (default: `http://localhost:8000`)

## Docker Commands

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Rebuild and start
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f server
```

## Services

- **Client**: React app served via Nginx on port 5173
- **Server**: FastAPI backend on port 8000
- **MongoDB**: Database on port 27017

## Development

### Adding New Features

1. **Frontend**: Add components in `client/src/`
2. **Backend**: Add routes in `server/main.py` or create separate router modules
3. **Database**: Collections are created automatically on first use

## Features

### Frontend Features
- **AMR Prediction**: Upload mass spectrometry data, enter clinical information, and get resistance predictions
- **E-Prescription Module**: Generate electronic prescriptions based on prediction results with:
  - Antibiotic recommendations (sorted by safety, usage, first-line preference)
  - Resistant antibiotic warnings
  - Prescription form with dosage, duration, and instructions
  - Print-ready prescription summary (single page PDF)
- **Surveillance Dashboard**: 
  - Interactive Pakistan map with regional resistance markers
  - Resistance trends over time (line charts)
  - Organism distribution charts (bar charts)
  - Regional data tables and details panels
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **Theme System**: Consistent design system with customizable colors

### Backend Features
- RESTful API with FastAPI
- MongoDB integration for data persistence
- **Real ML model integration** via Hugging Face Space API
- AMR prediction using MALDI-TOF mass spectrometry data (6000-dim spectrum)
- Supports 4 bacterial species: E. coli, K. pneumoniae, S. aureus, P. aeruginosa
- Bayesian uncertainty estimation for predictions
- Health check endpoints
- CORS configuration for frontend communication

## Model Integration

The application uses a deep learning model deployed on Hugging Face Spaces for AMR prediction:

- **Model API**: https://hasaan77-amr-prediction.hf.space/
- **Input**: MALDI-TOF mass spectrum (6000 float values) + bacterial species name
- **Output**: Per-antibiotic susceptibility predictions with Bayesian uncertainty
- **Supported Species**: 
  - Escherichia coli
  - Klebsiella pneumoniae
  - Staphylococcus aureus
  - Pseudomonas aeruginosa

The model uses:
- Deterministic head for main resistance probability predictions
- Bayesian head with Monte Carlo sampling for uncertainty estimation
- PubChem fingerprints for antibiotic representation

### File Format

The uploaded spectrum file should contain **exactly 6000 float values** in one of these formats:
- **CSV**: Comma-separated values (single row or multiple rows)
- **Text**: Space, tab, or newline-separated values

Example:
```
0.123, 0.456, 0.789, ... (6000 values total)
```

## Notes

- The app includes CORS middleware configured for local development
- MongoDB connection is optional - the app will run without it but with limited functionality
- All services are connected via Docker network `amr_network`
- Health checks are configured for MongoDB and server services
- E-Prescription print layout is optimized for single-page A4 printing
- The surveillance dashboard uses Leaflet maps and Recharts for data visualization
- The model API requires internet connectivity to access Hugging Face Spaces

