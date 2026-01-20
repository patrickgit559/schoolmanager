import React, { useEffect, useState } from 'react';
import { 
  getAcademicYears, 
  createAcademicYear, 
  updateAcademicYear, 
  deleteAcademicYear 
} from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Calendar } from 'lucide-react';

export default function AcademicYearManagement() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, year: null });
  const [saving, setSaving] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false
  });

  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      const response = await getAcademicYears();
      setYears(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (year = null) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        name: year.name,
        start_date: year.start_date || '',
        end_date: year.end_date || '',
        is_active: year.is_active
      });
    } else {
      setEditingYear(null);
      setFormData({ name: '', start_date: '', end_date: '', is_active: false });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    
    setSaving(true);
    try {
      if (editingYear) {
        await updateAcademicYear(editingYear.id, formData);
        toast.success('Année académique modifiée');
      } else {
        await createAcademicYear(formData);
        toast.success('Année académique créée');
      }
      setDialogOpen(false);
      loadYears();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.year) return;
    
    try {
      await deleteAcademicYear(deleteDialog.year.id);
      toast.success('Année académique supprimée');
      setDeleteDialog({ open: false, year: null });
      loadYears();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="academic-years-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Années académiques</h1>
          <p className="text-slate-500 mt-1">Gérer les années académiques</p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-year-btn">
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
          ) : years.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Calendar size={48} className="mb-4" />
              <p>Aucune année académique enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((year) => (
                  <TableRow key={year.id} data-testid={`year-row-${year.id}`}>
                    <TableCell className="font-medium">{year.name}</TableCell>
                    <TableCell>{year.start_date || '-'}</TableCell>
                    <TableCell>{year.end_date || '-'}</TableCell>
                    <TableCell>
                      {year.is_active ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(year)}>
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => setDeleteDialog({ open: true, year })}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingYear ? 'Modifier l\'année' : 'Ajouter une année'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: 2025-2026"
                data-testid="year-name-input"
              />
            </div>
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                data-testid="year-start-input"
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                data-testid="year-end-input"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                data-testid="year-active-switch"
              />
              <Label htmlFor="is_active">Année active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="save-year-btn">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingYear ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, year: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-4">Êtes-vous sûr de vouloir supprimer l'année "{deleteDialog.year?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, year: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
