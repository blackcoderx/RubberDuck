import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { explanationsAPI } from '../services/api';

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const [explanations, setExplanations] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    loadExplanations();

    // Refresh explanations list periodically to show new ones
    const interval = setInterval(loadExplanations, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadExplanations = async () => {
    try {
      const data = await explanationsAPI.getAll();
      setExplanations(data);
    } catch (error) {
      console.error('Failed to load explanations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">RubberDuck</h1>
          <p className="text-xs text-gray-500">AI Concept Explainer</p>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Collapse sidebar"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* New Explanation Button */}
      <div className="p-3">
        <Link
          to="/"
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Explanation
        </Link>
      </div>

      {/* Explanations List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
        ) : explanations.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            No explanations yet.<br />Create your first one!
          </div>
        ) : (
          <div className="space-y-1">
            {explanations.map((exp) => {
              const isActive = location.pathname.includes(exp.id);
              return (
                <Link
                  key={exp.id}
                  to={`/explanation/${exp.id}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="truncate">{exp.text}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatDate(exp.created_at)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;