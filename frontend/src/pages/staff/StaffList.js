import React, { useEffect, useState } from 'react';
import { 
  getStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff,
  getCampuses,
  getAcademicYears
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
import { Plus, Edit, Trash2, Loader2, UserCog, Download } from 'lucide-react';

export default function StaffList() {
  const { user, isFounder } = useAuth();
  const [staff, setStaff] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, staff: null });
  const [saving, setSaving] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    function: '',
    phone: '',
    campus_id: '',
    academic_year_id: '',
    photo: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadStaff();
    }
  }, [selectedYear]);

  const loadInitialData = async () => {
    try {
      const [campusesRes, yearsRes] = await Promise.all([
        getCampuses(),
        getAcademicYears()
      ]);
      setCampuses(campusesRes.data);
      setAcademicYears(yearsRes.data);
      
      const activeYear = yearsRes.data.find(y => y.is_active);
      if (activeYear) {
        setSelectedYear(activeYear.id);
        setFormData(prev => ({ ...prev, academic_year_id: activeYear.id }));
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await getStaff({ academic_year_id: selectedYear });
      setStaff(response.data);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const openDialog = (staffMember = null) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      setFormData({
        first_name: staffMember.first_name,
        last_name: staffMember.last_name,
        birth_date: staffMember.birth_date,
        birth_place: staffMember.birth_place,
        function: staffMember.function,
        phone: staffMember.phone || '',
        campus_id: staffMember.campus_id,
        academic_year_id: staffMember.academic_year_id,
        photo: staffMember.photo || ''
      });
    } else {
      setEditingStaff(null);
      setFormData({
        first_name: '',
        last_name: '',
        birth_date: '',
        birth_place: '',
        function: '',
        phone: '',
        campus_id: isFounder() ? '' : user?.campus_id,
        academic_year_id: selectedYear,
        photo: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.function) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setSaving(true);
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, formData);
        toast.success('Personnel modifié');
      } else {
        await createStaff(formData);
        toast.success('Personnel créé');
      }
      setDialogOpen(false);
      loadStaff();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.staff) return;
    
    try {
      await deleteStaff(deleteDialog.staff.id);
      toast.success('Personnel supprimé');
      setDeleteDialog({ open: false, staff: null });
      loadStaff();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="staff-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personnel</h1>
          <p className="text-slate-500 mt-1">{staff.length} membre(s) du personnel</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>
              {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" />PDF</Button>
          <Button onClick={() => openDialog()} data-testid="add-staff-btn">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <UserCog size={48} className="mb-4" />
              <p>Aucun personnel enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom & Prénom</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Date de naissance</TableHead>
                  <TableHead>Lieu de naissance</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id} data-testid={`staff-row-${s.id}`}>
                    <TableCell className="font-medium">{s.last_name} {s.first_name}</TableCell>
                    <TableCell>{s.function}</TableCell>
                    <TableCell>{s.birth_date ? new Date(s.birth_date).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell>{s.birth_place || '-'}</TableCell>
                    <TableCell>{s.phone || '-'}</TableCell>
                    <TableCell>{s.campus_name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(s)}><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteDialog({ open: true, staff: s })}><Trash2 size={16} /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Modifier le personnel' : 'Ajouter un personnel'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom *</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value.toUpperCase()})} placeholder="NOM" />
              </div>
              <div>
                <Label>Prénom *</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} placeholder="Prénom" />
              </div>
            </div>
            <div>
              <Label>Fonction *</Label>
              <Input value={formData.function} onChange={(e) => setFormData({...formData, function: e.target.value})} placeholder="Ex: Agent de sécurité, Chauffeur" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de naissance</Label>
                <Input type="date" value={formData.birth_date} onChange={(e) => setFormData({...formData, birth_date: e.target.value})} />
              </div>
              <div>
                <Label>Lieu de naissance</Label>
                <Input value={formData.birth_place} onChange={(e) => setFormData({...formData, birth_place: e.target.value})} placeholder="Ville" />
              </div>
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} placeholder="0707070707" />
            </div>
            {isFounder() && (
              <div>
                <Label>Campus *</Label>
                <Select value={formData.campus_id} onValueChange={(v) => setFormData({...formData, campus_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {campuses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Photo (URL)</Label>
              <Input value={formData.photo} onChange={(e) => setFormData({...formData, photo: e.target.value})} placeholder="URL de la photo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingStaff ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, staff: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="py-4">Supprimer {deleteDialog.staff?.last_name} {deleteDialog.staff?.first_name} ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, staff: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
