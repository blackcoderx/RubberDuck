import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { explanationsAPI } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';

function Home() {
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  usePageTitle('Home');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!concept.trim()) {
      setError('Please enter a concept to explain');
      return;
    }

    if (concept.trim().length < 3) {
      setError('Concept should be at least 3 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Call the Planner API
      const response = await explanationsAPI.create(concept.trim());

      // Navigate to overview page with the new explanation
      navigate(`/explanation/${response.explanation_id}`);
    } catch (err) {
      console.error('Error creating explanation:', err);
      setError(
        err.response?.data?.detail ||
        'Failed to create explanation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="max-w-2xl w-full px-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to RubberDuck
        </h1>
        <p className="text-gray-600 mb-8">
          Enter a programming concept you want to understand, and AI will create a comprehensive explanation for you.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., Go routines, React hooks, Docker containers..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={loading}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating explanation...
              </>
            ) : (
              'Explain This Concept'
            )}
          </button>
        </form>

        {/* Examples section */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3">Popular concepts to explore:</p>
          <div className="flex flex-wrap gap-2">
            {['React Server Components', 'Rust Ownership', 'Kubernetes Pods', 'GraphQL Resolvers'].map((example) => (
              <button
                key={example}
                onClick={() => setConcept(example)}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;