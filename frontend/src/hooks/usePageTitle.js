import { useEffect } from 'react';

export function usePageTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | RubberDuck` : 'RubberDuck - AI Concept Explainer';

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
