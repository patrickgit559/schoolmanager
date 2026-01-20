import React, { useEffect, useState } from 'react';
import { 
  getClasses, 
  createClass, 
  updateClass, 
  deleteClass,
  getAcademicYears,
  getFormations,
  getFilieres,
  getLevels,
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
import { Plus, Edit, Trash2, Loader2, Users } from 'lucide-react';

export default function ClassManagement() {
  const { user, isFounder } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, classItem: null });
  const [saving, setSaving] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  
  // Dropdowns
  const [academicYears, setAcademicYears] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [campuses, setCampuses] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    formation_id: '',
    filiere_id: '',
    level_id: '',
    campus_id: '',
    academic_year_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.formation_id) {
      loadFilieres();
    }
  }, [formData.formation_id]);

  const loadData = async () => {
    try {
      const [classesRes, yearsRes, formationsRes, levelsRes, campusesRes] = await Promise.all([
        getClasses(),
        getAcademicYears(),
        getFormations(),
        getLevels(),
        getCampuses()
      ]);
      setClasses(classesRes.data);
      setAcademicYears(yearsRes.data);
      setFormations(formationsRes.data);
      setLevels(levelsRes.data);
      setCampuses(campusesRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadFilieres = async () => {
    try {
      const response = await getFilieres(formData.formation_id);
      setFilieres(response.data);
    } catch (error) {
      console.error('Error loading filieres:', error);
    }
  };

  const openDialog = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        name: classItem.name,
        code: classItem.code,
        formation_id: classItem.formation_id,
        filiere_id: classItem.filiere_id,
        level_id: classItem.level_id,
        campus_id: classItem.campus_id,
        academic_year_id: classItem.academic_year_id
      });
    } else {
      setEditingClass(null);
      const activeYear = academicYears.find(y => y.is_active);
      setFormData({ 
        name: '', 
        code: '', 
        formation_id: '', 
        filiere_id: '', 
        level_id: '', 
        campus_id: isFounder() ? '' : user?.campus_id,
        academic_year_id: activeYear?.id || ''
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
      if (editingClass) {
        await updateClass(editingClass.id, formData);
        toast.success('Classe modifiée');
      } else {
        await createClass(formData);
        toast.success('Classe créée');
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
    if (!deleteDialog.classItem) return;
    
    try {
      await deleteClass(deleteDialog.classItem.id);
      toast.success('Classe supprimée');
      setDeleteDialog({ open: false, classItem: null });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="classes-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-slate-500 mt-1">Gérer les classes</p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-class-btn">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users size={48} className="mb-4" />
              <p>Aucune classe enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.id} data-testid={`class-row-${c.id}`}>
                    <TableCell className="font-mono">{c.code}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.formation_name}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{c.filiere_name}</TableCell>
                    <TableCell>{c.level_name}</TableCell>
                    <TableCell>{c.campus_name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(c)}>
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => setDeleteDialog({ open: true, classItem: c })}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Modifier la classe' : 'Ajouter une classe'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: IDA-1A"
                  data-testid="class-code-input"
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: IDA 1ère Année"
                  data-testid="class-name-input"
                />
              </div>
            </div>
            
            <div>
              <Label>Année académique *</Label>
              <Select value={formData.academic_year_id} onValueChange={(v) => setFormData({ ...formData, academic_year_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isFounder() && (
              <div>
                <Label>Campus *</Label>
                <Select value={formData.campus_id} onValueChange={(v) => setFormData({ ...formData, campus_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {campuses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Formation *</Label>
              <Select value={formData.formation_id} onValueChange={(v) => setFormData({ ...formData, formation_id: v, filiere_id: '' })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {formations.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Filière *</Label>
              <Select 
                value={formData.filiere_id} 
                onValueChange={(v) => setFormData({ ...formData, filiere_id: v })}
                disabled={!formData.formation_id}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {filieres.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Niveau *</Label>
              <Select value={formData.level_id} onValueChange={(v) => setFormData({ ...formData, level_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {levels.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="save-class-btn">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingClass ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, classItem: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-4">Êtes-vous sûr de vouloir supprimer la classe "{deleteDialog.classItem?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, classItem: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
