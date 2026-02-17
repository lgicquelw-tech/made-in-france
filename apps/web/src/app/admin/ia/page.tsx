'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  Save,
  RefreshCw,
  Zap,
  MessageSquare,
  Settings,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

const API_URL = 'http://localhost:4000';

interface AISettings {
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  anthropicApiKey: string;
  openaiApiKey: string;
  mistralApiKey: string;
  rules: Array<{ id: string; keyword: string; response: string; enabled: boolean }>;
}

const AVAILABLE_MODELS = [
  { id: 'claude-3-haiku-20240307', name: 'Claude Haiku 3', provider: 'anthropic', speed: '⚡⚡⚡', cost: '€', intelligence: '⭐⭐⭐' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude Sonnet 3.5', provider: 'anthropic', speed: '⚡⚡', cost: '€€', intelligence: '⭐⭐⭐⭐' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', speed: '⚡⚡', cost: '€€€', intelligence: '⭐⭐⭐⭐⭐' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', speed: '⚡⚡⚡', cost: '€', intelligence: '⭐⭐⭐' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', speed: '⚡⚡', cost: '€€€', intelligence: '⭐⭐⭐⭐⭐' },
];

const DEFAULT_PROMPT = `Assistant shopping Made in France. Tu aides à trouver des marques et produits français.

RÈGLES :
- Tutoie, sois concis (2 phrases max)
- TOUJOURS appeler search_products ou search_brands
- Présente 2-4 résultats pertinents, pas plus
- Termine TOUJOURS par des suggestions

FORMAT OBLIGATOIRE en fin de réponse :
[SUGGESTIONS]
Option1|Option2|Option3
[/SUGGESTIONS]

Exemples de suggestions : "Pour homme|Pour femme|Moins de 50€" ou "Voir plus|Autre style|Changer budget"

Si aucun résultat, propose d'élargir. Reste sur le Made in France.`;

export default function AdminIAPage() {
  const [settings, setSettings] = useState<AISettings>({
    model: 'claude-3-haiku-20240307',
    prompt: DEFAULT_PROMPT,
    temperature: 0.7,
    maxTokens: 1024,
    anthropicApiKey: '',
    openaiApiKey: '',
    mistralApiKey: '',
    rules: []
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ keyword: '', response: '' });
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showMistralKey, setShowMistralKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/ai/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setSettings(prev => ({ ...prev, ...data.data }));
        }
      }
    } catch (error) {
      console.error('Erreur chargement settings IA:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/ai/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Erreur sauvegarde settings IA:', error);
    } finally {
      setSaving(false);
    }
  };

  const testAI = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Je cherche un pull en laine' })
      });
      const data = await res.json();
      setTestResult(data.message || data.error || 'Réponse reçue');
    } catch (error) {
      setTestResult('Erreur: ' + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const addRule = () => {
    if (!newRule.keyword.trim() || !newRule.response.trim()) return;
    setSettings(prev => ({
      ...prev,
      rules: [...prev.rules, { 
        id: Date.now().toString(), 
        keyword: newRule.keyword, 
        response: newRule.response, 
        enabled: true 
      }]
    }));
    setNewRule({ keyword: '', response: '' });
  };

  const removeRule = (id: string) => {
    setSettings(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r.id !== id)
    }));
  };

  const toggleRule = (id: string) => {
    setSettings(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-purple-500" />
            Configuration IA
          </h1>
          <p className="text-gray-500 mt-1">Gérez le modèle, le prompt et les règles de l'assistant</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={testAI}
            disabled={testing}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Tester
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-france-blue text-white rounded-xl hover:bg-france-blue/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Résultat du test
          </h4>
          <p className="text-purple-800 text-sm whitespace-pre-wrap">{testResult}</p>
        </div>
      )}

      {/* Clés API */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-500" />
          Clés API
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clé Anthropic (Claude)</label>
            <div className="relative">
              <input
                type={showAnthropicKey ? 'text' : 'password'}
                value={settings.anthropicApiKey}
                onChange={(e) => setSettings(prev => ({ ...prev, anthropicApiKey: e.target.value }))}
                placeholder="sk-ant-api03-..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
              <button type="button" onClick={() => setShowAnthropicKey(!showAnthropicKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showAnthropicKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Requis pour Claude Haiku / Sonnet</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clé OpenAI (GPT)</label>
            <div className="relative">
              <input
                type={showOpenaiKey ? 'text' : 'password'}
                value={settings.openaiApiKey}
                onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                placeholder="sk-proj-..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
              <button type="button" onClick={() => setShowOpenaiKey(!showOpenaiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showOpenaiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Requis pour GPT-4o / GPT-4o Mini</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clé Mistral</label>
            <div className="relative">
              <input
                type={showMistralKey ? 'text' : 'password'}
                value={settings.mistralApiKey}
                onChange={(e) => setSettings(prev => ({ ...prev, mistralApiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
              <button type="button" onClick={() => setShowMistralKey(!showMistralKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showMistralKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Requis pour Mistral Small / Large</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modèle IA */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Modèle IA
            </h3>
            <div className="space-y-3">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSettings(prev => ({ ...prev, model: model.id }))}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${settings.model === model.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{model.name}</span>
                    <span className="text-xs text-gray-500 capitalize">{model.provider}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>⚡ {model.speed}</span>
                    <span>🧠 {model.intelligence}</span>
                    <span>💰 {model.cost}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Paramètres */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Paramètres</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Température ({settings.temperature})</label>
                <input type="range" min="0" max="1" step="0.1" value={settings.temperature} onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))} className="w-full" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Précis</span><span>Créatif</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max tokens</label>
                <input type="number" value={settings.maxTokens} onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              </div>
            </div>
          </div>
        </div>

        {/* Prompt et Règles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                Prompt système
              </h3>
              <button onClick={() => setSettings(prev => ({ ...prev, prompt: DEFAULT_PROMPT }))} className="text-sm text-purple-600 hover:underline">Réinitialiser</button>
            </div>
            <textarea
              value={settings.prompt}
              onChange={(e) => setSettings(prev => ({ ...prev, prompt: e.target.value }))}
              rows={16}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              placeholder="Instructions pour l'IA..."
            />
            <p className="text-xs text-gray-400 mt-2">{settings.prompt.length} caractères</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              Règles personnalisées
            </h3>
            <p className="text-sm text-gray-500 mb-4">Définissez des réponses automatiques pour certains mots-clés</p>
            <div className="space-y-3 mb-4">
              {settings.rules.map((rule) => (
                <div key={rule.id} className={`p-4 rounded-xl border ${rule.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">{rule.keyword}</span>
                      {!rule.enabled && <span className="text-xs text-gray-400 ml-2">Désactivée</span>}
                      <p className="text-sm text-gray-600 mt-2">{rule.response}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleRule(rule.id)} className="p-1 hover:bg-gray-100 rounded">
                        {rule.enabled ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                      </button>
                      <button onClick={() => removeRule(rule.id)} className="p-1 hover:bg-red-50 text-red-500 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {settings.rules.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucune règle définie</p>}
            </div>
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" value={newRule.keyword} onChange={(e) => setNewRule(prev => ({ ...prev, keyword: e.target.value }))} placeholder="Mot-clé (ex: nike)" className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                <input type="text" value={newRule.response} onChange={(e) => setNewRule(prev => ({ ...prev, response: e.target.value }))} placeholder="Réponse personnalisée..." className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                <button onClick={addRule} disabled={!newRule.keyword.trim() || !newRule.response.trim()} className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}