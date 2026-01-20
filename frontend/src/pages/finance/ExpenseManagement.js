import React, { useEffect, useState } from 'react';
import { 
  getTransactions, 
  createTransaction, 
  deleteTransaction,
  getAcademicYears,
  getCampuses
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, TrendingDown } from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Salaires',
  'Fournitures',
  'Maintenance',
  'Électricité',
  'Eau',
  'Internet',
  'Loyer',
  'Transport',
  'Formation',
  'Événements',
  'Autre'
];

export default function ExpenseManagement() {
  const { user, isFounder } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE',
    category: '',
    amount: 0,
    description: '',
    campus_id: '',
    academic_year_id: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) loadTransactions();
  }, [selectedYear]);

  const loadInitialData = async () => {
    try {
      const yearsRes = await getAcademicYears();
      setAcademicYears(yearsRes.data);
      
      const activeYear = yearsRes.data.find(y => y.is_active);
      if (activeYear) {
        setSelectedYear(activeYear.id);
        setFormData(prev => ({ ...prev, academic_year_id: activeYear.id }));
      }
      
      if (!isFounder() && user?.campus_id) {
        setFormData(prev => ({ ...prev, campus_id: user.campus_id }));
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await getTransactions({ 
        academic_year_id: selectedYear,
        type: 'EXPENSE'
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.amount || formData.amount <= 0) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    setSaving(true);
    try {
      await createTransaction(formData);
      toast.success('Dépense enregistrée');
      setDialogOpen(false);
      loadTransactions();
      setFormData(prev => ({
        ...prev,
        category: '',
        amount: 0,
        description: ''
      }));
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette dépense ?')) return;
    
    try {
      await deleteTransaction(id);
      toast.success('Dépense supprimée');
      loadTransactions();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount) + ' CFA';
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="page-transition" data-testid="expenses-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dépenses</h1>
          <p className="text-slate-500 mt-1">Gérer les dépenses de l'établissement</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>
              {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} data-testid="new-expense-btn">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle dépense
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total des dépenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <TrendingDown size={48} className="mb-4" />
              <p>Aucune dépense enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="font-medium">{t.category}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">-{formatCurrency(t.amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(t.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle dépense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <Label>Catégorie *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Montant (CFA) *</Label>
              <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} placeholder="50000" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Description de la dépense" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
