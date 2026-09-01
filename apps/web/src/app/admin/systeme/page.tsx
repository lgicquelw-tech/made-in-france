'use client';

import { useState } from 'react';
import { Settings, Database, Server, Shield, RefreshCw, AlertTriangle, CheckCircle, Clock, HardDrive, Cpu, Activity, Trash2, Download, Upload } from 'lucide-react';

export default function SystemePage() {
  const [isReindexing, setIsReindexing] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const systemStatus = {
    database: { status: 'healthy', latency: '12ms' },
    api: { status: 'healthy', latency: '45ms' },
    search: { status: 'healthy', latency: '23ms' },
    storage: { status: 'healthy', used: '45.2 GB', total: '100 GB' },
  };

  const recentJobs = [
    { id: '1', name: 'Synchronisation Stripe', status: 'completed', time: 'Il y a 5 min' },
    { id: '2', name: 'Import produits CSV', status: 'completed', time: 'Il y a 1h' },
    { id: '3', name: 'Génération sitemap', status: 'running', time: 'En cours...' },
    { id: '4', name: 'Backup base de données', status: 'completed', time: 'Il y a 6h' },
    { id: '5', name: 'Nettoyage images orphelines', status: 'failed', time: 'Il y a 12h' },
  ];

  const handleReindex = async () => {
    setIsReindexing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsReindexing(false);
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsClearingCache(false);
  };

  const StatusIndicator = ({ status }: { status: string }) => {
    if (status === 'healthy' || status === 'completed') {
      return <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />;
    }
    if (status === 'running') {
      return <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />;
    }
    if (status === 'failed') {
      return <div className="w-3 h-3 rounded-full bg-red-500" />;
    }
    return <div className="w-3 h-3 rounded-full bg-gray-300" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Système</h1>
          <p className="text-gray-500 mt-1">État du système et maintenance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Database className="w-5 h-5 text-blue-600" /></div>
              <div>
                <div className="font-medium text-gray-900">Base de données</div>
                <div className="text-sm text-gray-500">{systemStatus.database.latency}</div>
              </div>
            </div>
            <StatusIndicator status={systemStatus.database.status} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><Server className="w-5 h-5 text-green-600" /></div>
              <div>
                <div className="font-medium text-gray-900">API</div>
                <div className="text-sm text-gray-500">{systemStatus.api.latency}</div>
              </div>
            </div>
            <StatusIndicator status={systemStatus.api.status} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg"><Activity className="w-5 h-5 text-purple-600" /></div>
              <div>
                <div className="font-medium text-gray-900">Recherche</div>
                <div className="text-sm text-gray-500">{systemStatus.search.latency}</div>
              </div>
            </div>
            <StatusIndicator status={systemStatus.search.status} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><HardDrive className="w-5 h-5 text-amber-600" /></div>
              <div>
                <div className="font-medium text-gray-900">Stockage</div>
                <div className="text-sm text-gray-500">{systemStatus.storage.used} / {systemStatus.storage.total}</div>
              </div>
            </div>
            <StatusIndicator status={systemStatus.storage.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-france-blue" />
            Actions de maintenance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">Réindexer la recherche</div>
                <div className="text-sm text-gray-500">Reconstruire l'index de recherche</div>
              </div>
              <button onClick={handleReindex} disabled={isReindexing} className="flex items-center gap-2 px-4 py-2 bg-france-blue text-white rounded-lg hover:bg-france-blue/90 disabled:opacity-50 transition-colors">
                <RefreshCw className={`w-4 h-4 ${isReindexing ? 'animate-spin' : ''}`} />
                {isReindexing ? 'En cours...' : 'Lancer'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">Vider le cache</div>
                <div className="text-sm text-gray-500">Supprimer les données en cache</div>
              </div>
              <button onClick={handleClearCache} disabled={isClearingCache} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                {isClearingCache ? 'En cours...' : 'Vider'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">Exporter les données</div>
                <div className="text-sm text-gray-500">Télécharger un backup complet</div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-medium text-gray-900">Importer des données</div>
                <div className="text-sm text-gray-500">Restaurer depuis un backup</div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Upload className="w-4 h-4" />
                Importer
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-france-blue" />
            Tâches récentes
          </h3>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <StatusIndicator status={job.status} />
                  <div>
                    <div className="font-medium text-gray-900">{job.name}</div>
                    <div className="text-sm text-gray-500">{job.time}</div>
                  </div>
                </div>
                {job.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                {job.status === 'running' && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
                {job.status === 'failed' && <AlertTriangle className="w-5 h-5 text-red-500" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-france-blue" />
          Informations système
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-500">Version</div>
            <div className="font-medium text-gray-900">v2.4.1</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Environnement</div>
            <div className="font-medium text-gray-900">Production</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Dernière mise à jour</div>
            <div className="font-medium text-gray-900">15 janvier 2026</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Node.js</div>
            <div className="font-medium text-gray-900">v20.10.0</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Next.js</div>
            <div className="font-medium text-gray-900">v14.2.35</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Base de données</div>
            <div className="font-medium text-gray-900">PostgreSQL 15</div>
          </div>
        </div>
      </div>
    </div>
  );
}
