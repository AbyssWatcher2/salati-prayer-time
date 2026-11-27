import { CalendarDays, CheckSquare, History, Settings } from 'lucide-react';

export type AppTab = 'today' | 'schedule' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: AppTab;
  pendingCount: number;
  onSelectTab: (tab: AppTab) => void;
}

export function BottomNav({ activeTab, pendingCount, onSelectTab }: BottomNavProps) {
  const items: Array<{ id: AppTab; label: string; icon: typeof CheckSquare; badge?: number }> = [
    { id: 'today', label: 'اليوم', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'schedule', label: 'جدول مصر', icon: CalendarDays },
    { id: 'history', label: 'السجل', icon: History },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--nav-bg)',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition ${
                isActive ? 'text-emerald-400' : 'text-[var(--text-secondary)]'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge !== undefined && (
                  <span className="tabular-nums absolute -left-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-slate-950">
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
