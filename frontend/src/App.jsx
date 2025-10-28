import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Overview from './pages/Overview';
import ChapterDetail from './pages/ChapterDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="explanation/:explanationId" element={<Overview />} />
          <Route path="explanation/:explanationId/chapter/:chapterId" element={<ChapterDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;