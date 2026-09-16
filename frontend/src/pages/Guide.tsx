import { BookOpen, FolderOpen, RotateCcw, Brain, GraduationCap, BarChart3, Trophy, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    number: 1,
    icon: FolderOpen,
    title: 'Lernmaterialien importieren',
    description:
      'Lege PDF- oder PPTX-Dateien in den Inbox-Ordner. Das System erkennt sie automatisch und startet die KI-gestützte Verarbeitung. Lerneinheiten können in Unterordnern organisiert werden – der Ordnername wird zum Modul.',
    hint: 'inbox/ → Modellierung Klinischer Systeme/ → skript.pdf',
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    iconColor: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    number: 2,
    icon: BookOpen,
    title: 'Module & Lerneinheiten',
    description:
      'Das Dashboard zeigt alle importierten Dateien als Karten. Der Verarbeitungsstatus (pending → processing → ready) ist live sichtbar. Klicke auf eine Karte um alle generierten Fragen zu sehen, einzelne Themen zu vertiefen oder die Einheit neu zu verarbeiten.',
    hint: 'Dashboard → Karte anklicken → "Thema vertiefen"',
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
    iconColor: 'text-purple-500',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    number: 3,
    icon: RotateCcw,
    title: 'Tägliches Lernen (Spaced Repetition)',
    description:
      'Der Daily Review zeigt alle Karten, die heute fällig sind – basierend auf dem SM-2 Algorithmus. Je nach Selbsteinschätzung (Wieder / Schwer / Gut / Leicht) wird das nächste Wiederholungsintervall berechnet. Tägliches Lernen baut eine Streak auf.',
    hint: 'Daily Review → Karte umdrehen → Qualität bewerten',
    color: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    iconColor: 'text-green-500',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  {
    number: 4,
    icon: Brain,
    title: 'Karteikarten & Feynman-Technik',
    description:
      'Verschiedene Fragetypen: Multiple Choice, Wahr/Falsch, Lückentext, Kurzantwort und Feynman. Bei Feynman-Fragen erklärt man ein Konzept in eigenen Worten – die KI bewertet Vollständigkeit und Richtigkeit mit detailliertem Feedback.',
    hint: 'Frage lesen → antworten → KI-Feedback erhalten',
    color: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  {
    number: 5,
    icon: GraduationCap,
    title: 'Prüfungsmodus',
    description:
      'Simuliere eine Prüfung mit einem zufälligen Mix aus deinen Fragen. Wähle ein Modul oder alle verfügbaren Einheiten, lege die Anzahl der Fragen fest und starte. Am Ende siehst du dein Ergebnis mit einer Übersicht aller Fragen.',
    hint: 'Prüfung → Modul wählen → Anzahl → Start',
    color: 'bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800',
    iconColor: 'text-rose-500',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  },
  {
    number: 6,
    icon: BarChart3,
    title: 'Statistiken & Analytics',
    description:
      'Verfolge deinen Lernfortschritt mit Genauigkeitskurven, schwachen Themen (nach Trefferquote sortiert) und der Vergessenskurve nach Ebbinghaus. Erkenne, welche Themen du am meisten Wiederholung brauchst.',
    hint: 'Analytics → Zeitraum wählen → schwache Themen ansehen',
    color: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800',
    iconColor: 'text-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  },
  {
    number: 7,
    icon: Trophy,
    title: 'Erfolge & Gamification',
    description:
      'Sammle XP, steige Level auf und schalte Badges frei. Halte deine Lern-Streak aufrecht (täglich lernen) für besondere Auszeichnungen. Badges wie "Feynman Fan", "Perfectionist" oder "Week Warrior" motivieren durchzuhalten.',
    hint: 'Achievements → Badges → XP-Fortschritt',
    color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    iconColor: 'text-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
];

export function Guide() {
  const navigate = useNavigate();

  const restartTour = () => {
    localStorage.removeItem('tour_completed');
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Klick-Through-Guide
          </h1>
          <p className="text-muted-foreground mt-1">
            Schritt-für-Schritt durch alle Funktionen des Learning Dashboards.
          </p>
        </div>
        <Button variant="outline" onClick={restartTour} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Tour neu starten
        </Button>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className={`border rounded-lg p-5 ${step.color} transition-all`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 flex items-start gap-3">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${step.badge}`}>
                    {step.number}
                  </span>
                  <Icon className={`h-5 w-5 mt-1 ${step.iconColor}`} />
                </div>
                <div className="space-y-2 flex-1">
                  <h2 className="font-semibold text-base">{step.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <div className="mt-3 rounded-md bg-black/5 dark:bg-white/5 px-3 py-2">
                    <code className="text-xs font-mono text-muted-foreground">
                      {step.hint}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-card p-5 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Bereit zum Lernen? Starte direkt mit deinen fälligen Karten.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/review')}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Daily Review starten
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Zum Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
