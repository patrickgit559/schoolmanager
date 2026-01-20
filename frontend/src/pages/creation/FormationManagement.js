import React, { useEffect, useState } from 'react';
import { 
  getFormations, 
  createFormation, 
  updateFormation, 
  deleteFormation 
} from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, BookOpen } from 'lucide-react';

export default function FormationManagement() {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, formation: null });
  const [saving, setSaving] = useState(false);
  const [editingFormation, setEditingFormation] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });

  useEffect(() => {
    loadFormations();
  }, []);

  const loadFormations = async () => {
    try {
      const response = await getFormations();
      setFormations(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (formation = null) => {
    if (formation) {
      setEditingFormation(formation);
      setFormData({
        name: formation.name,
        code: formation.code
      });
    } else {
      setEditingFormation(null);
      setFormData({ name: '', code: '' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    
    setSaving(true);
    try {
      if (editingFormation) {
        await updateFormation(editingFormation.id, formData);
        toast.success('Formation modifiée');
      } else {
        await createFormation(formData);
        toast.success('Formation créée');
      }
      setDialogOpen(false);
      loadFormations();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.formation) return;
    
    try {
      await deleteFormation(deleteDialog.formation.id);
      toast.success('Formation supprimée');
      setDeleteDialog({ open: false, formation: null });
      loadFormations();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="formations-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Formations</h1>
          <p className="text-slate-500 mt-1">Gérer les types de formations (BTS, DUT, Licence, Master...)</p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-formation-btn">
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
          ) : formations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <BookOpen size={48} className="mb-4" />
              <p>Aucune formation enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formations.map((formation) => (
                  <TableRow key={formation.id} data-testid={`formation-row-${formation.id}`}>
                    <TableCell className="font-mono">{formation.code}</TableCell>
                    <TableCell className="font-medium">{formation.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(formation)}>
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => setDeleteDialog({ open: true, formation })}
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
            <DialogTitle>{editingFormation ? 'Modifier la formation' : 'Ajouter une formation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: BTS, LICENCE"
                data-testid="formation-code-input"
              />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Brevet de Technicien Supérieur"
                data-testid="formation-name-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="save-formation-btn">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingFormation ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, formation: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-4">Êtes-vous sûr de vouloir supprimer la formation "{deleteDialog.formation?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, formation: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
