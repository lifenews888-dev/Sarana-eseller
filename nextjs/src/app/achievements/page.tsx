'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy, ShoppingBag, Flame, Star, Wallet, Users, Radio, Mountain,
  Lock, CheckCircle, Loader2, Zap,
} from 'lucide-react';
import AchievementNotification from '@/components/AchievementNotification';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy, ShoppingBag, Flame, Star, Wallet, Users, Radio, Mountain,
};

interface AchievementItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earned: boolean;
  earnedAt: string | null;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  newAchievements: Array<{ name: string; points: number; icon?: string }>;
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ name: string; points: number; icon: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const [achRes, streakRes] = await Promise.all([
        fetch('/api/achievements', { headers: authHeaders() }),
        fetch('/api/achievements/streak', { method: 'POST', headers: authHeaders() }),
      ]);
      const achData = await achRes.json();
      if (achData.success) {
        setAchievements(achData.data.achievements);
        setTotalPoints(achData.data.totalPoints);
      }
      const streakData = await streakRes.json();
      if (streakData.success) {
        setStreak(streakData.data);
        // Show notification for newly earned achievements
        if (streakData.data.newAchievements?.length > 0) {
          const first = streakData.data.newAchievements[0];
          setNotification({ name: first.name, points: first.points, icon: first.icon || 'Trophy' });
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <AchievementNotification achievement={notification} onClose={() => setNotification(null)} />

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--esl-text-primary)]">Амжилтууд</h1>
        <p className="mt-1 text-[var(--esl-text-secondary)]">Амжилтуудаа цуглуулж, оноо авна уу</p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* Total points */}
        <div className="rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 p-4 text-center">
          <Trophy className="mx-auto mb-1 h-6 w-6 text-yellow-500" />
          <p className="text-2xl font-bold text-yellow-700">{totalPoints.toLocaleString()}</p>
          <p className="text-xs text-yellow-600">Нийт оноо</p>
        </div>

        {/* Current streak */}
        <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-4 text-center">
          <Flame className="mx-auto mb-1 h-6 w-6 text-orange-500" />
          <p className="text-2xl font-bold text-orange-700">{streak?.currentStreak || 0}</p>
          <p className="text-xs text-orange-600">Өдрийн дараалал</p>
        </div>

        {/* Earned count */}
        <div className="col-span-2 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-center sm:col-span-1">
          <Zap className="mx-auto mb-1 h-6 w-6 text-green-500" />
          <p className="text-2xl font-bold text-green-700">
            {achievements.filter((a) => a.earned).length}/{achievements.length}
          </p>
          <p className="text-xs text-green-600">Нээгдсэн</p>
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((ach) => {
          const Icon = ICON_MAP[ach.icon] || Trophy;
          return (
            <div
              key={ach.id}
              className={`relative rounded-xl border-2 p-5 transition-all ${
                ach.earned
                  ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-md'
                  : 'border-[var(--esl-border)] bg-[var(--esl-bg-section)] opacity-70'
              }`}
            >
              {/* Icon */}
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                  ach.earned ? 'bg-yellow-400 text-white' : 'bg-[var(--esl-bg-elevated)] text-[var(--esl-text-muted)]'
                }`}
              >
                {ach.earned ? (
                  <Icon className="h-6 w-6" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
              </div>

              {/* Text */}
              <h3 className={`font-semibold ${ach.earned ? 'text-[var(--esl-text-primary)]' : 'text-[var(--esl-text-secondary)]'}`}>
                {ach.name}
              </h3>
              <p className={`mt-1 text-sm ${ach.earned ? 'text-[var(--esl-text-secondary)]' : 'text-[var(--esl-text-muted)]'}`}>
                {ach.description}
              </p>

              {/* Points */}
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-sm font-medium ${ach.earned ? 'text-yellow-700' : 'text-[var(--esl-text-muted)]'}`}>
                  +{ach.points.toLocaleString()} оноо
                </span>
                {ach.earned && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {ach.earnedAt ? new Date(ach.earnedAt).toLocaleDateString('mn-MN') : 'Нээгдсэн'}
                  </span>
                )}
              </div>

              {/* Earned badge */}
              {ach.earned && (
                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {achievements.length === 0 && (
        <div className="py-16 text-center text-[var(--esl-text-muted)]">
          <Trophy className="mx-auto mb-3 h-12 w-12" />
          <p>Амжилтууд олдсонгүй. Seed хийнэ үү.</p>
        </div>
      )}
    </div>
  );
}
