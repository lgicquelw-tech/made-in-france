'use client';

import { useState } from 'react';
import { Bot, MessageSquare, Zap, DollarSign, TrendingUp, Clock, Search, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

export default function IAChatPage() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d'>('7d');

  const stats = {
    conversations: 2341,
    messages: 12450,
    tokensUsed: '1.25M',
    estimatedCost: 12.50,
    avgResponseTime: '1.2s',
    satisfactionRate: 94,
  };

  const recentConversations = [
    { id: '1', user: 'Jean D.', query: 'Où trouver des chaussures made in France ?', responses: 3, tokens: 2450, time: 'Il y a 5 min', status: 'completed' },
    { id: '2', user: 'Marie M.', query: 'Marques de cosmétiques français bio', responses: 5, tokens: 3200, time: 'Il y a 12 min', status: 'completed' },
    { id: '3', user: 'Pierre L.', query: 'Vêtements enfants fabriqués en France', responses: 4, tokens: 2800, time: 'Il y a 25 min', status: 'completed' },
    { id: '4', user: 'Sophie B.', query: 'Alternative française à Zara', responses: 6, tokens: 4100, time: 'Il y a 1h', status: 'flagged' },
    { id: '5', user: 'Lucas P.', query: 'Meubles made in France pas cher', responses: 3, tokens: 2100, time: 'Il y a 2h', status: 'completed' },
  ];

  const topQueries = [
    { query: 'chaussures made in france', count: 234 },
    { query: 'vêtements français', count: 189 },
    { query: 'cosmétiques bio france', count: 156 },
    { query: 'alternative à [marque]', count: 134 },
    { query: 'cadeaux made in france', count: 98 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IA & Chat</h1>
          <p className="text-gray-500 mt-1">Assistant IA et conversations</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
          {(['today', '7d', '30d'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-france-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl"><MessageSquare className="w-6 h-6 text-blue-600" /></div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.conversations.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Conversations</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl"><Zap className="w-6 h-6 text-purple-600" /></div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.tokensUsed}</div>
              <div className="text-sm text-gray-500">Tokens utilisés</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl"><DollarSign className="w-6 h-6 text-green-600" /></div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.estimatedCost} €</div>
              <div className="text-sm text-gray-500">Coût estimé</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.avgResponseTime}</div>
              <div className="text-sm text-gray-500">Temps de réponse moyen</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 rounded-xl"><TrendingUp className="w-6 h-6 text-teal-600" /></div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.satisfactionRate}%</div>
              <div className="text-sm text-gray-500">Taux de satisfaction</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
            <div>
              <div className="text-3xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-500">Conversations signalées</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-france-blue" />
              Conversations récentes
            </h3>
          </div>
          <div className="divide-y">
            {recentConversations.map((conv) => (
              <div key={conv.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{conv.user}</span>
                      {conv.status === 'flagged' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {conv.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{conv.query}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{conv.responses} réponses</span>
                      <span>{conv.tokens.toLocaleString()} tokens</span>
                      <span>{conv.time}</span>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-france-blue" />
            Questions fréquentes
          </h3>
          <div className="space-y-4">
            {topQueries.map((item, index) => (
              <div key={item.query} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-france-blue/10 flex items-center justify-center text-france-blue font-bold text-xs">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{item.query}</div>
                </div>
                <div className="text-sm font-medium text-gray-500">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
