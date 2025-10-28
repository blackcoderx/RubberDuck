import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { explanationsAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import { usePageTitle } from '../hooks/usePageTitle';

function Overview() {
  const { explanationId } = useParams();
  const navigate = useNavigate();
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);

  usePageTitle(explanation?.text);

  useEffect(() => {
    loadExplanation();
    // Start polling for status updates
    const interval = setInterval(checkStatus, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [explanationId]);

  const loadExplanation = async () => {
    try {
      const data = await explanationsAPI.getById(explanationId);
      setExplanation(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading explanation:', err);
      setError('Failed to load explanation');
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const statusData = await explanationsAPI.getStatus(explanationId);
      setStatus(statusData);

      // Refresh explanation data when chapters complete
      if (statusData.status !== 'completed') {
        const data = await explanationsAPI.getById(explanationId);
        setExplanation(data);
      }
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  const getStatusBadge = (chapterStatus) => {
    switch (chapterStatus) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completed
          </span>
        );
      case 'building':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Building...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading explanation...</p>
        </div>
      </div>
    );
  }

  if (error || !explanation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Explanation not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', link: '/' },
          { label: explanation.text },
        ]}
      />

      {/* Title and Overview */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {explanation.text}
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          {explanation.overview}
        </p>
      </div>

      {/* Status Banner */}
      {status && status.status !== 'completed' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>
              Building chapters: {status.completed_chapters} of {status.total_chapters} completed
            </span>
          </div>
        </div>
      )}

      {/* Chapters List */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Chapters</h2>
        <div className="space-y-3">
          {explanation.chapters && explanation.chapters.length > 0 ? (
            explanation.chapters.map((chapter, index) => {
              const isClickable = chapter.status === 'completed';
              const CardWrapper = isClickable ? Link : 'div';
              const cardProps = isClickable
                ? { to: `/explanation/${explanationId}/chapter/${chapter.id}` }
                : {};

              return (
                <CardWrapper
                  key={chapter.id}
                  {...cardProps}
                  className={`block p-4 bg-white border border-gray-200 rounded-lg transition-all ${
                    isClickable
                      ? 'hover:shadow-md hover:border-blue-300 cursor-pointer'
                      : 'opacity-75 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">
                          Chapter {index + 1}
                        </span>
                        {getStatusBadge(chapter.status)}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {chapter.title}
                      </h3>
                    </div>
                    {isClickable && (
                      <svg className="w-5 h-5 text-gray-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </CardWrapper>
              );
            })
          ) : (
            <p className="text-gray-500">No chapters available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Overview;