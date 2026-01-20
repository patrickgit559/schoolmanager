import React, { useEffect, useState } from 'react';
import { 
  getSubjects, 
  createSubject, 
  updateSubject, 
  deleteSubject,
  getFormations,
  getFilieres,
  getLevels
} from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, BookOpen, Filter } from 'lucide-react';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, subject: null });
  const [saving, setSaving] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  
  const [filters, setFilters] = useState({
    formation_id: '',
    filiere_id: '',
    level_id: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 2,
    coefficient: 1,
    formation_id: '',
    filiere_id: '',
    level_id: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [filters]);

  useEffect(() => {
    if (formData.formation_id) {
      loadFilieres(formData.formation_id);
    }
  }, [formData.formation_id]);

  const loadInitialData = async () => {
    try {
      const [formationsRes, levelsRes] = await Promise.all([
        getFormations(),
        getLevels()
      ]);
      setFormations(formationsRes.data);
      setLevels(levelsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadFilieres = async (formationId) => {
    try {
      const response = await getFilieres(formationId);
      setFilieres(response.data);
    } catch (error) {
      console.error('Error loading filieres:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const params = {};
      if (filters.formation_id) params.formation_id = filters.formation_id;
      if (filters.filiere_id) params.filiere_id = filters.filiere_id;
      if (filters.level_id) params.level_id = filters.level_id;
      
      const response = await getSubjects(params);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const openDialog = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        credits: subject.credits,
        coefficient: subject.coefficient,
        formation_id: subject.formation_id,
        filiere_id: subject.filiere_id,
        level_id: subject.level_id
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        credits: 2,
        coefficient: 1,
        formation_id: '',
        filiere_id: '',
        level_id: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Le nom et le code sont obligatoires');
      return;
    }
    
    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, formData);
        toast.success('Matière modifiée');
      } else {
        await createSubject(formData);
        toast.success('Matière créée');
      }
      setDialogOpen(false);
      loadSubjects();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.subject) return;
    
    try {
      await deleteSubject(deleteDialog.subject.id);
      toast.success('Matière supprimée');
      setDeleteDialog({ open: false, subject: null });
      loadSubjects();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="subjects-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matières</h1>
          <p className="text-slate-500 mt-1">Gérer les matières par formation, filière et niveau</p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-subject-btn">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter size={18} className="text-slate-400" />
            <Select value={filters.formation_id || 'all'} onValueChange={(v) => setFilters({...filters, formation_id: v === 'all' ? '' : v, filiere_id: ''})}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Formation" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {formations.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.filiere_id || 'all'} onValueChange={(v) => setFilters({...filters, filiere_id: v === 'all' ? '' : v})} disabled={!filters.formation_id}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filière" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {filieres.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.level_id || 'all'} onValueChange={(v) => setFilters({...filters, level_id: v === 'all' ? '' : v})}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Niveau" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <BookOpen size={48} className="mb-4" />
              <p>Aucune matière enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Crédits</TableHead>
                  <TableHead>Coefficient</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-mono">{subject.code}</TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>{subject.credits}</TableCell>
                    <TableCell>{subject.coefficient}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(subject)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteDialog({ open: true, subject })}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Modifier la matière' : 'Ajouter une matière'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="Ex: INFO101" />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nom de la matière" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Crédits</Label>
                <Input type="number" min="1" value={formData.credits} onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value) || 1})} />
              </div>
              <div>
                <Label>Coefficient</Label>
                <Input type="number" min="0.5" step="0.5" value={formData.coefficient} onChange={(e) => setFormData({...formData, coefficient: parseFloat(e.target.value) || 1})} />
              </div>
            </div>
            <div>
              <Label>Formation *</Label>
              <Select value={formData.formation_id} onValueChange={(v) => setFormData({...formData, formation_id: v, filiere_id: ''})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {formations.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filière *</Label>
              <Select value={formData.filiere_id} onValueChange={(v) => setFormData({...formData, filiere_id: v})} disabled={!formData.formation_id}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {filieres.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Niveau *</Label>
              <Select value={formData.level_id} onValueChange={(v) => setFormData({...formData, level_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingSubject ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, subject: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmer la suppression</DialogTitle></DialogHeader>
          <p className="py-4">Supprimer la matière "{deleteDialog.subject?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, subject: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
