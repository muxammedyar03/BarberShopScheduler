import React from 'react';
import { 
  Scissors, 
  Users, 
  Building, 
  LogOut, 
  ChevronLeft, 
  Menu,
  LayoutDashboard,
  Calendar,
  Settings,
  CreditCard,
  User
} from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface SidebarProps {
  perspective: 'owner' | 'barber' | 'client';
  setPerspective: (p: 'owner' | 'barber' | 'client') => void;
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
  user: any;
}

export default function Sidebar({ perspective, setPerspective, isCollapsed, setIsCollapsed, user }: SidebarProps) {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { id: 'client', label: 'Клиент', icon: Users, roles: ['client', 'barber', 'admin'] },
    { id: 'barber', label: 'Мастер', icon: Scissors, roles: ['barber', 'admin'] },
    { id: 'owner', label: 'Владелец', icon: Building, roles: ['admin'] },
  ];

  const userRole = user?.role || 'client';
  const filteredItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className={`fixed left-0 top-0 h-full z-50 bg-[#0d0f1b]/80 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Logo Section */}
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-black text-white tracking-tight uppercase text-sm">Barber CRM</span>
          </div>
        )}
        {isCollapsed && (
          <Scissors className="w-6 h-6 text-cyan-400 mx-auto" />
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hidden lg:block"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {!user && (
           <button 
           onClick={handleLogin}
           className="w-full flex items-center gap-3 p-3 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 hover:bg-cyan-400/20 transition-all font-bold text-xs"
         >
           <User className="w-5 h-5" />
           {!isCollapsed && <span>Войти через Google</span>}
         </button>
        )}

        {filteredItems.map((item) => {
          const isActive = perspective === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPerspective(item.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-400/20 to-blue-600/10 text-white border border-cyan-400/20 shadow-lg' 
                  : 'text-slate-450 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'}`} />
              {!isCollapsed && <span className="font-bold text-xs">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-white/5 space-y-4">
        {user && (
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'p-2'}`}>
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full border border-white/10"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{user.displayName}</p>
                <p className="text-[9px] text-slate-500 truncate uppercase tracking-wider">{user.role}</p>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={user ? handleLogout : handleLogin}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
            isCollapsed ? 'justify-center' : ''
          } text-slate-450 hover:text-rose-400 hover:bg-rose-500/5`}
        >
          {user ? <LogOut className="w-5 h-5" /> : <User className="w-5 h-5" />}
          {!isCollapsed && <span className="font-bold text-xs">{user ? 'Выйти' : 'Войти'}</span>}
        </button>
      </div>
    </aside>
  );
}
