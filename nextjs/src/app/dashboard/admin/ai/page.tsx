'use client';

import { useState, useEffect } from 'react';
import { Brain, Loader2, Download, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Analysis {
  id: string;
  score: number;
  issues: { severity: string; text: string }[];
  fullText: string;
  stats: { users: number; orders: number; shops: number; products: number; sellers: number; pendingOrders: number; deliveredOrders: number };
}

interface HistoryItem {
  id: string;
  title: string;
  description: string;
  suggestion: string;
  evidence: { score?: number; issues?: Analysis['issues']; stats?: Analysis['stats'] } | null;
  createdAt: string;
}

export default function AdminAiPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/admin/ai/analyze', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => setHistory(d.data || []))
      .catch(() => {});
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setProgress('Системийн мэдээлэл цуглуулж байна...');
    const t1 = setTimeout(() => setProgress('Claude AI шинжилж байна...'), 2000);
    const t2 = setTimeout(() => setProgress('Тайлан бэлтгэж байна...'), 8000);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ type: 'FULL_AUDIT' }),
      });
      const data = await res.json();
      if (data.data) setAnalysis(data.data);
      else if (data.fullText) setAnalysis(data as Analysis);
      else setProgress('Алдаа: ' + (data.error || 'Unknown'));
    } catch (e) {
      setProgress('Алдаа гарлаа');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
      if (!analysis) setTimeout(() => setProgress(''), 3000);
    }
  };

  const viewHistory = (h: HistoryItem) => {
    const meta = h.evidence || {};
    setAnalysis({
      id: h.id,
      score: meta.score || 0,
      issues: meta.issues || [],
      fullText: h.suggestion || h.description || '',
      stats: meta.stats || ({} as Analysis['stats']),
    });
  };

  const exportTxt = () => {
    if (!analysis) return;
    const blob = new Blob([analysis.fullText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `eseller-audit-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  const scoreColor = (s: number) => s >= 80 ? '#16A34A' : s >= 60 ? '#D97706' : '#E8242C';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--esl-text-primary)' }}>
            <Brain className="w-5 h-5" style={{ color: '#E8242C' }} /> Claude — Системийн мастер шинжилэгч
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>Платформыг бүхэлд нь шинжлэн тайлан гаргана</p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-all"
          style={{ background: loading ? 'var(--esl-border)' : '#E8242C' }}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> {progress}</> : <><RefreshCw className="w-4 h-4" /> Бүрэн шинжилгээ эхлүүлэх</>}
        </button>
      </div>

      {/* Analysis result */}
      {analysis && (
        <div className="space-y-4 mb-8">
          {/* Score + Stats */}
          <div className="rounded-xl p-6" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
            <div className="flex gap-6 flex-wrap">
              <div className="text-center">
                <div className="text-5xl font-black" style={{ color: scoreColor(analysis.score) }}>{analysis.score}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>/ 100 оноо</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 flex-1">
                {[
                  { label: 'Хэрэглэгч', value: analysis.stats?.users },
                  { label: 'Захиалга', value: analysis.stats?.orders },
                  { label: 'Дэлгүүр', value: analysis.stats?.shops },
                  { label: 'Бараа', value: analysis.stats?.products },
                  { label: 'Борлуулагч', value: analysis.stats?.sellers },
                  { label: 'Хүлээгдэж буй', value: analysis.stats?.pendingOrders },
                  { label: 'Хүргэгдсэн', value: analysis.stats?.deliveredOrders },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--esl-bg-section)' }}>
                    <div className="text-lg font-bold" style={{ color: 'var(--esl-text-primary)' }}>{s.value ?? 0}</div>
                    <div className="text-[10px]" style={{ color: 'var(--esl-text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issues */}
          {analysis.issues?.length > 0 && (
            <div className="rounded-xl p-5" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--esl-text-primary)' }}>Илэрсэн асуудлууд ({analysis.issues.length})</h3>
              <div className="space-y-2">
                {analysis.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{
                    background: issue.severity === 'critical' ? 'rgba(232,36,44,0.08)' : issue.severity === 'warning' ? 'rgba(217,119,6,0.08)' : 'rgba(22,163,74,0.08)',
                    borderLeft: `3px solid ${issue.severity === 'critical' ? '#E8242C' : issue.severity === 'warning' ? '#D97706' : '#16A34A'}`,
                    color: 'var(--esl-text-primary)',
                  }}>
                    {issue.severity === 'critical' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#E8242C' }} /> :
                     issue.severity === 'warning' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#D97706' }} /> :
                     <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#16A34A' }} />}
                    <span>{issue.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full report */}
          <div className="rounded-xl p-5" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>Бүрэн тайлан</h3>
              <button onClick={exportTxt} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer"
                style={{ borderColor: 'var(--esl-border)', color: 'var(--esl-text-muted)', background: 'var(--esl-bg-section)' }}>
                <Download className="w-3.5 h-3.5" /> Татаж авах
              </button>
            </div>
            <div className="rounded-lg p-4 text-sm leading-relaxed overflow-y-auto"
              style={{ background: 'var(--esl-bg-section)', color: 'var(--esl-text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 500 }}>
              {analysis.fullText}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--esl-text-primary)' }}>Шинжилгээний түүх</h3>
          <div className="space-y-2">
            {history.map(h => {
              const score = h.evidence?.score || 0;
              return (
                <div key={h.id} onClick={() => viewHistory(h)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:opacity-80 transition"
                  style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>{h.title}</p>
                    <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>{new Date(h.createdAt).toLocaleString('mn-MN')}</p>
                  </div>
                  <span className="text-lg font-black" style={{ color: scoreColor(score) }}>{score}/100</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
