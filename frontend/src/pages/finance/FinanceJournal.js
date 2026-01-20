import React, { useEffect, useState } from 'react';
import { getTransactions, getAcademicYears } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loader2, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function FinanceJournal() {
  const [transactions, setTransactions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) loadTransactions();
  }, [selectedYear]);

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

  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'INCOME') acc.income += t.amount;
    else acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <div className="page-transition" data-testid="finance-journal-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Journal financier</h1>
          <p className="text-slate-500 mt-1">Historique de toutes les transactions</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Année" /></SelectTrigger>
          <SelectContent>
            {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total recettes</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totals.income)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total dépenses</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totals.expense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Solde</p>
                <p className={`text-xl font-bold ${totals.income - totals.expense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(totals.income - totals.expense)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <BookOpen size={48} className="mb-4" />
              <p>Aucune transaction enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Badge className={t.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {t.type === 'INCOME' ? 'Recette' : 'Dépense'}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className={`text-right font-medium ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
