import React, { useEffect, useState } from 'react';
import { 
  getLevels, 
  createLevel, 
  updateLevel, 
  deleteLevel 
} from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, GraduationCap } from 'lucide-react';

export default function LevelManagement() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, level: null });
  const [saving, setSaving] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    order: 1
  });

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    try {
      const response = await getLevels();
      setLevels(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (level = null) => {
    if (level) {
      setEditingLevel(level);
      setFormData({
        name: level.name,
        order: level.order
      });
    } else {
      setEditingLevel(null);
      setFormData({ name: '', order: levels.length + 1 });
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
      if (editingLevel) {
        await updateLevel(editingLevel.id, formData);
        toast.success('Niveau modifié');
      } else {
        await createLevel(formData);
        toast.success('Niveau créé');
      }
      setDialogOpen(false);
      loadLevels();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.level) return;
    
    try {
      await deleteLevel(deleteDialog.level.id);
      toast.success('Niveau supprimé');
      setDeleteDialog({ open: false, level: null });
      loadLevels();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="levels-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Niveaux</h1>
          <p className="text-slate-500 mt-1">Gérer les niveaux d'études</p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-level-btn">
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
          ) : levels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <GraduationCap size={48} className="mb-4" />
              <p>Aucun niveau enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => (
                  <TableRow key={level.id} data-testid={`level-row-${level.id}`}>
                    <TableCell className="font-mono">{level.order}</TableCell>
                    <TableCell className="font-medium">{level.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(level)}>
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => setDeleteDialog({ open: true, level })}
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
            <DialogTitle>{editingLevel ? 'Modifier le niveau' : 'Ajouter un niveau'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: 1ère Année, Master 1"
                data-testid="level-name-input"
              />
            </div>
            <div>
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                data-testid="level-order-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="save-level-btn">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingLevel ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, level: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-4">Êtes-vous sûr de vouloir supprimer le niveau "{deleteDialog.level?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, level: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
