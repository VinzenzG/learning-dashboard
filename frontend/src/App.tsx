import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { LearningUnitPage } from '@/pages/LearningUnit';
import { DailyReview } from '@/pages/DailyReview';
import { QuizSession } from '@/pages/QuizSession';
import { Analytics } from '@/pages/Analytics';
import { Achievements } from '@/pages/Achievements';
import { Settings } from '@/pages/Settings';
import { ExamMode } from '@/pages/ExamMode';
import { Guide } from '@/pages/Guide';
import { AppTour } from '@/components/tour/AppTour';

function NotFound() {
  return (
    <div className="p-6 text-center text-muted-foreground">
      <p className="text-lg font-semibold">404 – Seite nicht gefunden</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppTour />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/unit/:id" element={<LearningUnitPage />} />
          <Route path="/review" element={<DailyReview />} />
          <Route path="/quiz/:unitId" element={<QuizSession />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/exam" element={<ExamMode />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
