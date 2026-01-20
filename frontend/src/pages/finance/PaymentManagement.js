import React, { useEffect, useState } from 'react';
import { 
  getTransactions, 
  createTransaction, 
  deleteTransaction,
  getStudents,
  getAcademicYears,
  getCampuses
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Search, DollarSign, Receipt } from 'lucide-react';

export default function PaymentManagement() {
  const { user, isFounder } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'INCOME',
    category: 'Scolarité',
    amount: 0,
    description: '',
    student_id: '',
    campus_id: '',
    academic_year_id: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadTransactions();
    }
  }, [selectedYear]);

  const loadInitialData = async () => {
    try {
      const [yearsRes, campusesRes] = await Promise.all([
        getAcademicYears(),
        getCampuses()
      ]);
      setAcademicYears(yearsRes.data);
      setCampuses(campusesRes.data);
      
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
        type: 'INCOME'
      });
      setTransactions(response.data.filter(t => t.category === 'Scolarité'));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const searchStudents = async () => {
    if (!searchStudent.trim()) return;
    
    try {
      const response = await getStudents({ search: searchStudent });
      setStudents(response.data);
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    }
  };

  const selectStudent = (student) => {
    setFormData(prev => ({
      ...prev,
      student_id: student.id,
      description: `Paiement scolarité - ${student.last_name} ${student.first_name}`,
      campus_id: student.campus_id
    }));
    setSearchStudent(`${student.last_name} ${student.first_name} (${student.matricule})`);
    setStudents([]);
  };

  const handleSubmit = async () => {
    if (!formData.student_id || !formData.amount || formData.amount <= 0) {
      toast.error('Veuillez sélectionner un étudiant et entrer un montant valide');
      return;
    }
    
    setSaving(true);
    try {
      await createTransaction(formData);
      toast.success('Paiement enregistré');
      setDialogOpen(false);
      loadTransactions();
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'INCOME',
        category: 'Scolarité',
        amount: 0,
        description: '',
        student_id: '',
        campus_id: isFounder() ? '' : user?.campus_id,
        academic_year_id: selectedYear
      });
      setSearchStudent('');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce paiement ?')) return;
    
    try {
      await deleteTransaction(id);
      toast.success('Paiement supprimé');
      loadTransactions();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(amount) + ' CFA';
  };

  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="page-transition" data-testid="payments-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paiements étudiants</h1>
          <p className="text-slate-500 mt-1">Gérer les paiements de scolarité</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map(y => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setDialogOpen(true)} data-testid="new-payment-btn">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau paiement
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total encaissé</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
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
              <Receipt size={48} className="mb-4" />
              <p>Aucun paiement enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id} data-testid={`payment-row-${t.id}`}>
                    <TableCell>{new Date(t.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="font-medium">{t.student_name}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      +{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => handleDelete(t.id)}
                      >
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

      {/* New Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rechercher un étudiant</Label>
              <div className="flex gap-2">
                <Input
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                  placeholder="Nom, matricule..."
                  data-testid="search-student-payment"
                />
                <Button variant="outline" onClick={searchStudents}>
                  <Search size={18} />
                </Button>
              </div>
              {students.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-[150px] overflow-y-auto">
                  {students.map(s => (
                    <div 
                      key={s.id}
                      className="p-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => selectStudent(s)}
                    >
                      <p className="font-medium">{s.last_name} {s.first_name}</p>
                      <p className="text-xs text-slate-500">{s.matricule} - {s.filiere_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="payment-date"
              />
            </div>
            
            <div>
              <Label>Montant (CFA) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="Ex: 50000"
                data-testid="payment-amount"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du paiement"
                data-testid="payment-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="save-payment-btn">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
