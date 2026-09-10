import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

interface Settings {
  aiProvider: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  watchFolder: string;
  questionsPerChunk: number;
}

export function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.settings.get().then(setSettings).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.settings.update(settings);
      toast.success('Einstellungen gespeichert (bis zum nächsten Neustart)');
    } catch {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-6 text-muted-foreground">Lade…</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      <Card>
        <CardHeader><CardTitle>KI-Konfiguration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>KI-Provider</Label>
            <Select
              value={settings.aiProvider}
              onValueChange={v => setSettings({ ...settings, aiProvider: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-cli">Claude CLI (empfohlen)</SelectItem>
                <SelectItem value="claude-sdk">Claude SDK (API Key)</SelectItem>
                <SelectItem value="ollama">Ollama (lokal)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.aiProvider === 'ollama' && (
            <>
              <div className="space-y-2">
                <Label>Ollama URL</Label>
                <Input
                  value={settings.ollamaBaseUrl}
                  onChange={e => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Modell</Label>
                <Input
                  value={settings.ollamaModel}
                  onChange={e => setSettings({ ...settings, ollamaModel: e.target.value })}
                  placeholder="llama3.2"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Fragen pro Chunk</Label>
            <Input
              type="number"
              min={2} max={15}
              value={settings.questionsPerChunk}
              onChange={e => setSettings({ ...settings, questionsPerChunk: parseInt(e.target.value) || 6 })}
            />
            <p className="text-xs text-muted-foreground">Empfohlen: 4–8 Fragen pro ~3000 Zeichen Text</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ordner</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Inbox-Ordner</Label>
            <Input
              value={settings.watchFolder}
              onChange={e => setSettings({ ...settings, watchFolder: e.target.value })}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Lege PDF/PPTX-Dateien in diesen Ordner — sie werden automatisch verarbeitet.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? 'Speichert…' : 'Speichern'}
      </Button>
    </div>
  );
}
