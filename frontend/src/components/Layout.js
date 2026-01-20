import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  FileText,
  DollarSign,
  Archive,
  Settings,
  LogOut,
  Menu,
  X,
  UserCog,
  Clock,
  Award,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from './ui/button';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { 
    path: '/students', 
    icon: GraduationCap, 
    label: 'Étudiants',
    submenu: [
      { path: '/students/inscription', label: 'Inscription' },
      { path: '/students/reinscription', label: 'Réinscription' },
      { path: '/students/cards', label: 'Carte étudiante' },
      { path: '/students/list', label: 'Liste des étudiants' },
    ]
  },
  { 
    path: '/creation', 
    icon: Building2, 
    label: 'Création',
    submenu: [
      { path: '/creation/campus', label: 'Campus' },
      { path: '/creation/academic-years', label: 'Années académiques' },
      { path: '/creation/formations', label: 'Formations' },
      { path: '/creation/filieres', label: 'Filières' },
      { path: '/creation/levels', label: 'Niveaux' },
      { path: '/creation/classes', label: 'Classes' },
      { path: '/creation/subjects', label: 'Matières' },
    ]
  },
  { 
    path: '/professors', 
    icon: Users, 
    label: 'Professeurs',
    submenu: [
      { path: '/professors/list', label: 'Liste' },
      { path: '/professors/hours', label: 'Suivi heures' },
    ]
  },
  { 
    path: '/staff', 
    icon: UserCog, 
    label: 'Personnel',
    submenu: [
      { path: '/staff/list', label: 'Liste' },
      { path: '/staff/cards', label: 'Carte Pro' },
    ]
  },
  { 
    path: '/grades', 
    icon: BookOpen, 
    label: 'Moyenne & Bulletin',
    submenu: [
      { path: '/grades/entry', label: 'Moyennes' },
      { path: '/grades/bulletins', label: 'Bulletins' },
      { path: '/grades/list', label: 'Liste de notes' },
    ]
  },
  { 
    path: '/documents', 
    icon: FileText, 
    label: 'Documents',
    submenu: [
      { path: '/documents/frequentation', label: 'Certificat de fréquentation' },
      { path: '/documents/scolarite', label: 'Certificat de scolarité' },
      { path: '/documents/admission', label: 'Certificat d\'admission' },
      { path: '/documents/authentification', label: 'Attestation d\'authentification' },
    ]
  },
  { path: '/diplomas', icon: Award, label: 'Diplômes' },
  { 
    path: '/finance', 
    icon: DollarSign, 
    label: 'Finance',
    submenu: [
      { path: '/finance/journal', label: 'Journal' },
      { path: '/finance/payments', label: 'Paiement étudiant' },
      { path: '/finance/expenses', label: 'Dépenses' },
      { path: '/finance/balance', label: 'Bilan' },
    ]
  },
  { path: '/archives', icon: Archive, label: 'Archives' },
  { path: '/users', icon: Settings, label: 'Utilisateurs' },
];

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState([]);

  const toggleSubmenu = (path) => {
    setExpandedMenus(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="mobile-menu-btn"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} data-testid="sidebar">
        <div className="sidebar-logo">
          <h1 className="text-xl font-bold text-white">SUP'INTER</h1>
          <p className="text-xs text-slate-400 mt-1">Système de Gestion</p>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.path}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleSubmenu(item.path)}
                    className={`sidebar-item w-full ${isActive(item.path) ? 'active' : ''}`}
                    data-testid={`nav-${item.path.replace('/', '')}`}
                  >
                    <item.icon size={20} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {expandedMenus.includes(item.path) ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>
                  {expandedMenus.includes(item.path) && (
                    <div className="pl-8 space-y-1">
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`sidebar-item py-2 text-sm ${location.pathname === sub.path ? 'active' : ''}`}
                          onClick={() => setSidebarOpen(false)}
                          data-testid={`nav-${sub.path.replace(/\//g, '-')}`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.path.replace('/', '')}`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-content-center text-white font-semibold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-xs truncate">{user?.campus_name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/10"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut size={18} className="mr-2" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
