import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getAcademicYears } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  TrendingUp,
  DollarSign,
  UserPlus,
  CreditCard,
  Search,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadStats();
    }
  }, [selectedYear]);

  const loadAcademicYears = async () => {
    try {
      const response = await getAcademicYears();
      setAcademicYears(response.data);
      const activeYear = response.data.find(y => y.is_active);
      if (activeYear) {
        setSelectedYear(activeYear.id);
      } else if (response.data.length > 0) {
        setSelectedYear(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await getDashboardStats({ academic_year_id: selectedYear });
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0F172A', '#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="page-transition" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Bienvenue, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear} data-testid="year-select">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Année académique" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card card-hover" data-testid="stat-students">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Étudiants</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.total_students || 0}</p>
              </div>
              <div className="stat-card-icon bg-blue-100">
                <GraduationCap className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card card-hover" data-testid="stat-professors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Professeurs</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.total_professors || 0}</p>
              </div>
              <div className="stat-card-icon bg-green-100">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card card-hover" data-testid="stat-classes">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Classes ouvertes</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.total_classes || 0}</p>
              </div>
              <div className="stat-card-icon bg-purple-100">
                <Building2 className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card card-hover" data-testid="stat-formations">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Formations</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.total_formations || 0}</p>
              </div>
              <div className="stat-card-icon bg-orange-100">
                <BookOpen className="text-orange-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8" data-testid="quick-actions">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-300"
              onClick={() => navigate('/students/inscription')}
              data-testid="quick-inscription"
            >
              <UserPlus className="text-orange-500" size={24} />
              <span>Inscription étudiant</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300"
              onClick={() => navigate('/finance/payments')}
              data-testid="quick-payment"
            >
              <CreditCard className="text-green-500" size={24} />
              <span>Nouveau paiement</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
              onClick={() => navigate('/students/list')}
              data-testid="quick-consult"
            >
              <Search className="text-blue-500" size={24} />
              <span>Consulter étudiants</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Students by Formation */}
        <Card data-testid="chart-formations">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Étudiants par formation</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.students_by_formation?.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.students_by_formation}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="formation_name" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value?.substring(0, 10) + '...'}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0F172A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students by Filiere */}
        <Card data-testid="chart-filieres">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Répartition par filière</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.students_by_filiere?.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.students_by_filiere}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                      nameKey="filiere_name"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.students_by_filiere.map((entry, index) => (
                        <Cell key={entry.filiere_id} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card data-testid="financial-summary">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="text-green-500" size={20} />
            Résumé financier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-600 font-medium">Total recettes</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {formatCurrency(stats?.total_income || 0)}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-xl">
              <p className="text-sm text-red-600 font-medium">Total dépenses</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {formatCurrency(stats?.total_expenses || 0)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600 font-medium">Solde</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {formatCurrency(stats?.balance || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
