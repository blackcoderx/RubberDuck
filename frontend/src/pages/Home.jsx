import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { explanationsAPI } from '../services/api';
import { usePageTitle } from '../hooks/usePageTitle';
import SocialLinks from '../components/SocialLinks';

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
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="max-w-3xl w-full mb-8 text-center">
        <h1 className="text-5xl font-semibold text-gray-900 dark:text-white mb-3">
          Welcome to RubberDuck
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Enter a programming concept you want to understand
        </p>
      </div>

      <div className="max-w-3xl w-full">
        {/* Claude.ai style input */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-3xl shadow-sm hover:shadow-md focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 focus-within:ring-opacity-20 transition-all">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., Go routines, React hooks, Docker containers..."
              className="flex-1 px-6 py-4 bg-transparent border-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:cursor-not-allowed"
              disabled={loading}
              autoFocus
            />

            <button
              type="submit"
              disabled={loading || !concept.trim()}
              className="absolute right-2 p-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
              title="Send"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 px-2">{error}</p>
          )}
        </form>

        {/* Examples section */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 text-center">Try these examples:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['React Server Components', 'Rust Ownership', 'Kubernetes Pods', 'GraphQL Resolvers'].map((example) => (
              <button
                key={example}
                onClick={() => setConcept(example)}
                disabled={loading}
                className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12">
          <SocialLinks />
        </div>
      </div>
    </div>
  );
}

export default Home;