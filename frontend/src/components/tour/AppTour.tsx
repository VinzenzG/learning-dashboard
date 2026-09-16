import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_KEY = 'tour_completed';

export function AppTour() {
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      overlayColor: 'rgba(0,0,0,0.5)',
      nextBtnText: 'Weiter →',
      prevBtnText: '← Zurück',
      doneBtnText: 'Fertig!',
      progressText: 'Schritt {{current}} von {{total}}',
      onDestroyStarted: () => {
        localStorage.setItem(STORAGE_KEY, '1');
        driverObj.destroy();
      },
      steps: [
        {
          popover: {
            title: 'Willkommen im Learning Dashboard! 👋',
            description:
              'Diese kurze Tour zeigt dir die wichtigsten Funktionen. Du kannst sie jederzeit unter <b>Hilfe → Guide</b> erneut starten.',
            side: 'over',
            align: 'center',
          },
        },
        {
          element: '#sidebar-nav',
          popover: {
            title: 'Navigation',
            description:
              'Hier navigierst du zwischen allen Bereichen: Dashboard, Daily Review, Prüfungsmodus, Analytics, Erfolge und Einstellungen.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#nav-dashboard',
          popover: {
            title: 'Dashboard',
            description:
              'Deine Übersicht: alle importierten Lernmaterialien als Karten. Der Status zeigt, ob eine Datei gerade verarbeitet wird.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#nav-review',
          popover: {
            title: 'Daily Review',
            description:
              'Hier lernst du täglich. Das System zeigt nur Karten, die heute fällig sind – basierend auf dem Spaced-Repetition-Algorithmus SM-2.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#nav-exam',
          popover: {
            title: 'Prüfungsmodus',
            description:
              'Starte eine Prüfungssimulation mit einem Mix aus allen deinen Fragen. Wähle ein Modul und die Anzahl der Fragen.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#nav-analytics',
          popover: {
            title: 'Analytics',
            description:
              'Verfolge deinen Lernfortschritt. Sieh deine tägliche Genauigkeit, schwache Themen und die Vergessenskurve nach Ebbinghaus.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#nav-achievements',
          popover: {
            title: 'Achievements & XP',
            description:
              'Sammle Erfahrungspunkte, steige Level auf und schalte Badges frei. Tägliches Lernen baut eine Streak auf.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#nav-guide',
          popover: {
            title: 'Diese Tour erneut starten',
            description:
              'Unter "Hilfe" findest du den vollständigen Guide – und du kannst diese Tour jederzeit neu starten.',
            side: 'right',
            align: 'start',
          },
        },
        {
          popover: {
            title: 'Los geht\'s! 🚀',
            description:
              'Du bist startklar. Lege PDF- oder PPTX-Dateien in den <b>inbox/</b>-Ordner und das System erledigt den Rest. Viel Erfolg beim Lernen!',
            side: 'over',
            align: 'center',
          },
        },
      ],
    });

    const timer = setTimeout(() => driverObj.drive(), 800);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
