import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AnalyticsAccuracy, WeakSpot, ForgettingPoint } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export function Analytics() {
  const [accuracy, setAccuracy] = useState<AnalyticsAccuracy[]>([]);
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>([]);
  const [forgetting, setForgetting] = useState<ForgettingPoint[]>([]);

  useEffect(() => {
    api.analytics.accuracy(30).then(setAccuracy).catch(console.error);
    api.analytics.weakSpots().then(setWeakSpots).catch(console.error);
    api.analytics.forgettingCurve().then(setForgetting).catch(console.error);
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Accuracy over time */}
      <Card>
        <CardHeader><CardTitle>Genauigkeit (letzte 30 Tage)</CardTitle></CardHeader>
        <CardContent>
          {accuracy.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Daten.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={accuracy}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Genauigkeit']} />
                <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Weak spots radar */}
        <Card>
          <CardHeader><CardTitle>Schwache Themen</CardTitle></CardHeader>
          <CardContent>
            {weakSpots.length < 3 ? (
              <p className="text-muted-foreground text-sm">Mindestens 3 Themen nötig.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={weakSpots}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="topic_tag" tick={{ fontSize: 10 }} />
                  <Radar name="Genauigkeit" dataKey="accuracy" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Genauigkeit']} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Forgetting curve */}
        <Card>
          <CardHeader><CardTitle>Vergessenskurve (Ebbinghaus)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={forgetting}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dayOffset" label={{ value: 'Tage', position: 'insideRight', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Retention']} />
                <Area type="monotone" dataKey="retentionPct" stroke="#ef4444" fill="#fca5a5" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2">Ohne Wiederholung vergisst das Gehirn ~63% nach einer Woche.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
