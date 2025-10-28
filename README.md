# RubberDuck 🦆

**AI-Powered Programming Concept Explainer**

RubberDuck is an intelligent learning companion that helps developers understand complex programming concepts through comprehensive, structured explanations powered by Google's Gemini AI with real-time web search capabilities.

## Features

✨ **Intelligent Planning & Building**
- **Planner AI**: Instantly generates a structured learning plan with title, overview, and chapter outlines
- **Builder AI**: Creates detailed chapter content in the background with up-to-date information from Google Search
- **Progressive Loading**: Start reading immediately while content is being generated

📚 **Structured Learning**
- **5-Chapter Framework**: What, Why, How, Where, and Pitfalls
- **Rich Content**: Markdown formatting with bold, italics, lists, tables, and more
- **Syntax Highlighting**: Beautiful code blocks with language detection and line numbers
- **Breadcrumb Navigation**: Easy navigation similar to Notion

🎨 **Clean Interface**
- **Collapsible Sidebar**: Access past explanations quickly
- **Real-Time Updates**: Watch chapters build with live status indicators
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Code Theme**: VS Code-style syntax highlighting

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Tortoise ORM** - Async ORM for Python
- **SQLite** - Lightweight database
- **Google Gemini AI** - Advanced AI with Google Search grounding
- **Uvicorn** - ASGI server

### Frontend
- **React** - UI library
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **React Markdown** - Markdown rendering
- **React Syntax Highlighter** - Code syntax highlighting

## Installation

### Prerequisites
- Python 3.10+
- Node.js 20.19+ or 22.12+
- Google Gemini API Key ([Get one here](https://ai.google.dev/))

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment (optional but recommended)**
   ```bash
   python -m venv .rubberduck
   source .rubberduck/bin/activate  # On Windows: .rubberduck\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.0-flash-exp
   ```

5. **Run the backend server**
   ```bash
   python run.py
   ```

   The API will be available at `http://localhost:8000`

   View API docs at `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Usage

1. **Start the Application**
   - Make sure both backend and frontend servers are running
   - Open `http://localhost:5173` in your browser

2. **Create an Explanation**
   - Enter a programming concept (e.g., "React Hooks", "Go Routines", "Docker Containers")
   - Click "Explain This Concept"
   - The Planner AI generates the structure instantly

3. **Explore Content**
   - View the overview and chapter titles immediately
   - Watch as chapters are built in real-time (status updates every 3 seconds)
   - Click on completed chapters to read detailed content

4. **Navigate**
   - Use the sidebar to access past explanations
   - Use breadcrumbs to navigate between pages
   - Collapse the sidebar for more reading space

## Project Structure

```
RubberDuck/
├── backend/
│   ├── api/
│   │   ├── models.py         # Database models (Explanation, Chapter, Content)
│   │   ├── schemas.py        # Pydantic schemas for API
│   │   ├── routes.py         # API endpoints
│   │   ├── genai.py          # Gemini AI services (Planner & Builder)
│   │   ├── db_config.py      # Database configuration
│   │   └── main.py           # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   ├── run.py               # Server entry point
│   └── .env                 # Environment variables (not in git)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Main layout with sidebar
│   │   │   ├── Sidebar.jsx          # Collapsible sidebar
│   │   │   ├── Breadcrumb.jsx       # Navigation breadcrumbs
│   │   │   └── MarkdownContent.jsx  # Markdown renderer with code highlighting
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Concept input page
│   │   │   ├── Overview.jsx         # Explanation overview with chapters
│   │   │   └── ChapterDetail.jsx    # Chapter content page
│   │   ├── services/
│   │   │   └── api.js               # API client
│   │   ├── hooks/
│   │   │   └── usePageTitle.js      # Dynamic page titles
│   │   ├── App.jsx                  # Router setup
│   │   └── main.jsx                 # React entry point
│   ├── package.json          # Node dependencies
│   └── .env                  # Environment variables (not in git)
│
└── README.md
```

## API Endpoints

### Explanations
- `POST /api/explanations` - Create new explanation
- `GET /api/explanations` - List all explanations
- `GET /api/explanations/{id}` - Get specific explanation with chapters
- `GET /api/explanations/{id}/status` - Get build status

### Chapters
- `GET /api/chapters/{id}` - Get chapter with content

## How It Works

1. **User Input**: User enters a programming concept
2. **Planner Phase**: Gemini AI with Google Search generates:
   - Concept title
   - Overview (2-3 sentences)
   - 5 chapter titles following the framework
3. **Database Storage**: Explanation and empty chapters are saved
4. **Immediate Response**: User sees the structure right away
5. **Builder Phase** (Background): For each chapter:
   - Gemini AI with Google Search generates detailed content
   - Content is saved to database with proper formatting
   - Chapter status updates to "completed"
6. **Real-Time Updates**: Frontend polls every 3 seconds to show progress

## Features in Detail

### Google Search Grounding
- Every AI request includes real-time web search
- Ensures up-to-date and accurate information
- References current best practices and conventions

### Markdown Support
- **Bold** and *italic* text
- Bullet and numbered lists
- Code blocks with syntax highlighting
- Tables, blockquotes, and links
- Inline code formatting

### Smart Code Detection
- Automatic language detection (JavaScript, Python, Go, Java, PHP, Rust)
- Line numbers for easy reference
- Dark theme optimized for readability

## Development

### Backend Development
```bash
cd backend
# Make changes to code
# Server auto-reloads with uvicorn --reload
```

### Frontend Development
```bash
cd frontend
npm run dev
# Vite HMR enables instant updates
```

### Building for Production

**Backend:**
```bash
cd backend
# Update uvicorn command in run.py to remove reload
python run.py
```

**Frontend:**
```bash
cd frontend
npm run build
# Static files in dist/ folder
```

## Troubleshooting

### Backend Issues
- **Module not found**: Ensure you're in the backend directory and ran `pip install -r requirements.txt`
- **Database errors**: Delete `db.sqlite3` and restart the server
- **API key errors**: Check your `.env` file has valid `GEMINI_API_KEY`

### Frontend Issues
- **Build errors**: Delete `node_modules` and `package-lock.json`, then run `npm install`
- **API connection**: Verify `VITE_API_URL` in `.env` matches backend URL
- **Blank page**: Check browser console for errors

## Future Enhancements

- [ ] User authentication
- [ ] Save favorite explanations
- [ ] Export explanations to PDF/Markdown
- [ ] Custom chapter templates
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Share explanations with others

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with Google Gemini AI
- Inspired by Notion's clean UI
- Code highlighting powered by Prism
- Markdown rendering by react-markdown

---

**Made with ❤️ for developers learning new concepts**

🦆 Happy Learning!
