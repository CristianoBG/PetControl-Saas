import { Home, ArrowLeftRight, Syringe, Settings, Package, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Início' },
  { path: '/vacinas', icon: Syringe, label: 'Vacinas' },
  { path: '/scanner', icon: ArrowLeftRight, label: 'Movimentar' },
  { path: '/estoque', icon: Package, label: 'Estoque' },
  { path: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '?');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150",
                active ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150",
              location.pathname === '/admin' ? "bg-primary/15 text-primary border border-primary/30" : "text-muted-foreground"
            )}
          >
            <ShieldCheck className={cn("h-5 w-5", location.pathname === '/admin' && "stroke-[2.5]")} />
            <span className="text-[9px] font-medium">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
}
