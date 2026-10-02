import React, { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { formatEntityLabel } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { AppPage, ModelTypeKey } from '../types/models';

interface HistoryPageProps {
  onNavigate: (page: AppPage) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { user, predictions, updatePredictionNote, deletePrediction } =
    useAuth();

  const [filterModel, setFilterModel] = useState<'all' | ModelTypeKey>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');

  const filtered = predictions.filter((p) =>
    filterModel === 'all' ? true : p.modelType === filterModel
  );

  const handleExportHistory = () => {
    if (filtered.length === 0) return;
    const headers = [
      'Date',
      'Tool',
      'Country',
      'Category',
      'Summary Result',
      'Numeric Score',
      'Reference Period',
      'Status',
      'Planning Notes',
    ];
    const rows = filtered.map((p) =>
      [
        p.createdAtIso,
        `"${p.modelDisplayName.replace(/"/g, '""')}"`,
        formatEntityLabel(p.countryName),
        formatEntityLabel(p.category),
        `"${p.summaryValue.replace(/"/g, '""')}"`,
        p.numericResult,
        `"${p.recordDate.replace(/"/g, '""')}"`,
        p.predictionStatus,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'demandaura_saved_analyses.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
      <div className="bg-aura-banner text-white rounded-2xl p-6 lg:p-8 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs text-cyan-300 font-medium">
            {user
              ? 'Personal Market Foresight Log · Synced Across Your Devices'
              : 'Current Session Log · Sign in to save across devices'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Saved Market Analyses &amp; Planning Notes
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportHistory}
            disabled={filtered.length === 0}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900/80 border border-slate-700 rounded-xl hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
          {!user && (
            <button
              type="button"
              onClick={() => onNavigate('signin')}
              className="px-4 py-2 text-xs font-semibold text-white btn-aura-primary rounded-xl cursor-pointer whitespace-nowrap"
            >
              Sign In to Sync History
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        {[
          { id: 'all', label: `All Analyses (${predictions.length})` },
          { id: 'divergence', label: 'Demand vs. Hype Score' },
          { id: 'forecast', label: '4-Week Search Forecast' },
          { id: 'segmentation_overall', label: '3+ Year Market Groups' },
          { id: 'segmentation_4w', label: '4-Week Momentum Profiles' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterModel(tab.id as 'all' | ModelTypeKey)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filterModel === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-sm font-semibold text-slate-900">
              No saved market analyses yet
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Check a Demand vs. Hype Divergence Score, run a 4-Week Search
              Interest Forecast, or explore Market Segmentation to save your
              analyses and planning notes here.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('divergence')}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Check Demand vs. Hype Score
              </button>
              <button
                type="button"
                onClick={() => onNavigate('forecast')}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Run 4-Week Forecast
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                  <th className="py-3 px-4 font-medium">Date &amp; Time</th>
                  <th className="py-3 px-4 font-medium">Foresight Tool</th>
                  <th className="py-3 px-4 font-medium">Market Evaluated</th>
                  <th className="py-3 px-4 font-medium">Key Finding</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Planning Notes</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono-tabular text-slate-500 whitespace-nowrap">
                      {new Date(item.createdAtIso).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                      {item.modelDisplayName}
                    </td>
                    <td className="py-3 px-4 text-slate-800 whitespace-nowrap font-medium">
                      {formatEntityLabel(item.countryName)} ·{' '}
                      {formatEntityLabel(item.category)}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {item.summaryValue}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Period: {item.recordDate}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono-tabular">
                      <span
                        className={
                          item.predictionStatus === 'error'
                            ? 'text-red-700 font-semibold'
                            : 'text-emerald-700 font-semibold'
                        }
                      >
                        {item.predictionStatus === 'error'
                          ? 'Incomplete'
                          : 'Completed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={500}
                            value={editNotesText}
                            onChange={(e) => setEditNotesText(e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-300 rounded w-full"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              await updatePredictionNote(
                                item.id,
                                editNotesText
                              );
                              setEditingId(null);
                            }}
                            className="px-2 py-1 text-xs bg-slate-900 text-white rounded cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditNotesText(item.notes || '');
                          }}
                          className="text-left hover:text-slate-900 underline decoration-dotted cursor-pointer"
                        >
                          {item.notes || '+ Add planning note'}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => deletePrediction(item.id)}
                        title="Delete record"
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
