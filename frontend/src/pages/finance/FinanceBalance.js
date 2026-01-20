import React, { useEffect, useState } from 'react';
import { getTransactions, getAcademicYears } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Download, Loader2, TrendingUp, TrendingDown, Scale, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinanceBalance() {
  const [transactions, setTransactions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);

  const MONTHS = [
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ];

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) loadTransactions();
  }, [selectedYear, selectedMonth]);

  const loadAcademicYears = async () => {
    try {
      const response = await getAcademicYears();
      setAcademicYears(response.data);
      const activeYear = response.data.find(y => y.is_active);
      if (activeYear) setSelectedYear(activeYear.id);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await getTransactions({ academic_year_id: selectedYear });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount) + ' CFA';

  // Filter by month if selected
  const filteredTransactions = selectedMonth 
    ? transactions.filter(t => new Date(t.date).getMonth() + 1 === parseInt(selectedMonth))
    : transactions;

  // Calculate totals
  const totals = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'INCOME') acc.income += t.amount;
    else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });

  // Group by category
  const byCategory = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = { income: 0, expense: 0 };
    if (t.type === 'INCOME') acc[t.category].income += t.amount;
    else acc[t.category].expense += t.amount;
    return acc;
  }, {});

  // Prepare chart data by month
  const chartData = MONTHS.map(m => {
    const monthTransactions = transactions.filter(t => new Date(t.date).getMonth() + 1 === parseInt(m.value));
    return {
      name: m.label.substring(0, 3),
      Recettes: monthTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0),
      Dépenses: monthTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)
    };
  });

  const exportPDF = () => {
    toast.success('Export PDF du bilan');
  };

  return (
    <div className="page-transition" data-testid="balance-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bilan financier</h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble des finances</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>
              {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedMonth || 'all'} onValueChange={(v) => setSelectedMonth(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Mois" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              {MONTHS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center">
                    <TrendingUp className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Total Recettes</p>
                    <p className="text-2xl font-bold text-green-800">{formatCurrency(totals.income)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-red-500 flex items-center justify-center">
                    <TrendingDown className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-sm text-red-700">Total Dépenses</p>
                    <p className="text-2xl font-bold text-red-800">{formatCurrency(totals.expense)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={`bg-gradient-to-br ${totals.income - totals.expense >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${totals.income - totals.expense >= 0 ? 'bg-blue-500' : 'bg-orange-500'} flex items-center justify-center`}>
                    <Scale className="text-white" size={28} />
                  </div>
                  <div>
                    <p className={`text-sm ${totals.income - totals.expense >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Solde</p>
                    <p className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                      {formatCurrency(totals.income - totals.expense)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Évolution mensuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(v) => `${(v/1000)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="Recettes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* By Category */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(byCategory).map(([category, values]) => (
                  <div key={category} className="p-4 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-700 mb-2">{category}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">+ {formatCurrency(values.income)}</span>
                      <span className="text-red-600">- {formatCurrency(values.expense)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
