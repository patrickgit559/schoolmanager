import React, { useEffect, useState } from 'react';
import { 
  getProfessors, 
  createProfessor, 
  updateProfessor, 
  deleteProfessor,
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
import { Plus, Edit, Trash2, Loader2, Users, Download } from 'lucide-react';

export default function ProfessorList() {
  const { user, isFounder } = useAuth();
  const [professors, setProfessors] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, professor: null });
  const [saving, setSaving] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    specialty: '',
    campus_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [professorsRes, campusesRes] = await Promise.all([
        getProfessors(),
        getCampuses()
      ]);
      setProfessors(professorsRes.data);
      setCampuses(campusesRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (professor = null) => {
    if (professor) {
      setEditingProfessor(professor);
      setFormData({
        first_name: professor.first_name,
        last_name: professor.last_name,
        phone: professor.phone,
        email: professor.email || '',
        specialty: professor.specialty,
        campus_id: professor.campus_id
      });
    } else {
      setEditingProfessor(null);
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        specialty: '',
        campus_id: isFounder() ? '' : user?.campus_id
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.first_name || !formData.last_name || !formData.specialty) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setSaving(true);
    try {
      if (editingProfessor) {
        await updateProfessor(editingProfessor.id, formData);
        toast.success('Professeur modifié');
      } else {
        await createProfessor(formData);
        toast.success('Professeur créé');
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.professor) return;
    
    try {
      await deleteProfessor(deleteDialog.professor.id);
      toast.success('Professeur supprimé');
      setDeleteDialog({ open: false, professor: null });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportToPDF = () => {
    toast.info('Export PDF en cours de développement');
  };

  return (
    <div className="page-transition" data-testid="professors-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Professeurs</h1>
          <p className="text-slate-500 mt-1">{professors.length} professeur(s) enregistré(s)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button onClick={() => openDialog()} data-testid="add-professor-btn">
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
          ) : professors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users size={48} className="mb-4" />
              <p>Aucun professeur enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom & Prénom</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professors.map((professor) => (
                  <TableRow key={professor.id} data-testid={`professor-row-${professor.id}`}>
                    <TableCell className="font-medium">{professor.last_name} {professor.first_name}</TableCell>
                    <TableCell>{professor.specialty}</TableCell>
                    <TableCell>{professor.phone}</TableCell>
                    <TableCell>{professor.email || '-'}</TableCell>
                    <TableCell>{professor.campus_name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(professor)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteDialog({ open: true, professor })}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProfessor ? 'Modifier le professeur' : 'Ajouter un professeur'}</DialogTitle>
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
              <Label>Spécialité *</Label>
              <Input value={formData.specialty} onChange={(e) => setFormData({...formData, specialty: e.target.value})} placeholder="Ex: Algorithmique, Comptabilité" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Téléphone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} placeholder="0707070707" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@supinter.edu" />
              </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingProfessor ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, professor: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="py-4">Supprimer le professeur {deleteDialog.professor?.last_name} {deleteDialog.professor?.first_name} ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, professor: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
