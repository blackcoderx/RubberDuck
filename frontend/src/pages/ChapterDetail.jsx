import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { chaptersAPI, explanationsAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import { usePageTitle } from '../hooks/usePageTitle';
import MarkdownContent from '../components/MarkdownContent';

function ChapterDetail() {
  const { explanationId, chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageTitle(chapter?.title);

  useEffect(() => {
    loadData();
  }, [chapterId]);

  const loadData = async () => {
    try {
      const [chapterData, explanationData] = await Promise.all([
        chaptersAPI.getById(chapterId),
        explanationsAPI.getById(explanationId),
      ]);

      setChapter(chapterData);
      setExplanation(explanationData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading chapter:', err);
      setError('Failed to load chapter');
      setLoading(false);
    }
  };

  const renderContent = (content) => {
    // Handle different content types
    let markdownContent = content.value;

    // If it's marked as code but not already in markdown code blocks, wrap it
    if (content.content_type === 'code') {
      // Check if it's already wrapped in markdown code blocks
      if (!markdownContent.startsWith('```')) {
        // Detect language for proper syntax highlighting
        let language = 'javascript';
        if (markdownContent.includes('package main') || markdownContent.includes('func ')) {
          language = 'go';
        } else if (markdownContent.includes('def ') || markdownContent.includes('import ')) {
          language = 'python';
        } else if (markdownContent.includes('const ') || markdownContent.includes('let ')) {
          language = 'javascript';
        } else if (markdownContent.includes('<?php')) {
          language = 'php';
        } else if (markdownContent.includes('public class') || markdownContent.includes('public static')) {
          language = 'java';
        } else if (markdownContent.includes('fn ') || markdownContent.includes('impl ')) {
          language = 'rust';
        }

        // Wrap in markdown code fence
        markdownContent = `\`\`\`${language}\n${markdownContent}\n\`\`\``;
      }
    }

    return (
      <div key={content.id}>
        <MarkdownContent content={markdownContent} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-300">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Chapter not found'}</p>
          <button
            onClick={() => navigate(`/explanation/${explanationId}`)}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Back to Overview
          </button>
        </div>
      </div>
    );
  }

  if (chapter.status !== 'completed') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Chapter is being built...</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our AI is generating detailed content for this chapter. This usually takes a minute or two.
          </p>
          <button
            onClick={() => navigate(`/explanation/${explanationId}`)}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Back to Overview
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
          { label: explanation?.text || 'Explanation', link: `/explanation/${explanationId}` },
          { label: chapter.title },
        ]}
      />

      {/* Chapter Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {chapter.title}
        </h1>
      </div>

      {/* Chapter Content */}
      <div className="prose prose-lg max-w-none dark:prose-invert">
        {chapter.contents && chapter.contents.length > 0 ? (
          chapter.contents.map((content) => renderContent(content))
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No content available for this chapter.</p>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Link
          to={`/explanation/${explanationId}`}
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Overview
        </Link>
      </div>
    </div>
  );
}

export default ChapterDetail;