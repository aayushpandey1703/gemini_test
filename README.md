# ✦ GlowTask - Premium Note & Task Manager

GlowTask is a secure, high-performance, and visually stunning note-taking and task management application. It features a modern FastAPI backend coupled with a gorgeous dark-themed glassmorphism single page application (SPA) frontend.

---

## 🚀 Features

- **JWT Authentication**: Secure user registration and login utilizing encrypted JWT access tokens stored client-side.
- **Full Task CRUD**: Create, read, update, and delete tasks/notes seamlessly.
- **Task Toggle Completion**: Complete tasks dynamically with custom styled SVG checkmarks and strike-through text transitions.
- **Live Statistics**: Real-time stats panel tracking total, active, and completed items.
- **Client-Side Filters**: Quickly toggle views between **All**, **Active**, and **Completed** tasks.
- **Glassmorphism UI**: Beautiful, interactive interface with custom HSL color schemes, animated glow spheres, smooth transitions, and responsive grids.
- **Interactive Toasts**: Dynamic sliding notifications for system alerts, success, and errors.
- **Automatic Swagger Docs**: Powered by FastAPI at `/docs`.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI, SQLModel, Uvicorn, Python-Jose (JWT), Bcrypt (Direct hashing)
- **Database**: SQLite (Local file `tasks.db` created dynamically)
- **Frontend**: Vanilla HTML5, CSS3 (Custom properties/variables, animations), Vanilla JavaScript (fetch API)

---

## 📂 Project Directory Structure

```text
gemini_test/
├── static/               # Frontend Assets
│   ├── index.html        # Main SPA interface layout
│   ├── styles.css        # Premium dark glassmorphism stylesheet
│   └── app.js            # JS state, routing, and fetch operations
├── auth.py               # Password hashing & JWT dependencies
├── crud.py               # Database CRUD helper operations
├── database.py           # SQLite connection & session creator
├── main.py               # FastAPI routers & static app server
├── models.py             # SQLModel tables and schema validations
├── requirements.txt      # Python dependencies
└── README.md             # Project documentation (this file)
```

---

## 💻 Getting Started

### Prerequisites
- Python 3.10+

### Setup Instructions

1. **Clone the Repository** (or navigate to the project directory):
   ```bash
   cd gemini_test
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (CMD)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Uvicorn Server**:
   ```bash
   uvicorn main:app --reload
   ```

---

## 🌐 Endpoints & Usage

Once the server is running, you can access the project resources at:

- **Web Application Dashboard**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **API Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API ReDoc View**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
