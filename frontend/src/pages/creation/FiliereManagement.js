import React, { useEffect, useState } from 'react';
import { 
  getFilieres, 
  createFiliere, 
  updateFiliere, 
  deleteFiliere,
  getFormations 
} from '../../lib/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Layers } from 'lucide-react';

export default function FiliereManagement() {
  const [filieres, setFilieres] = useState([]);
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, filiere: null });
  const [saving, setSaving] = useState(false);
  const [editingFiliere, setEditingFiliere] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    formation_ids: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [filieresRes, formationsRes] = await Promise.all([
        getFilieres(),
        getFormations()
      ]);
      setFilieres(filieresRes.data);
      setFormations(formationsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (filiere = null) => {
    if (filiere) {
      setEditingFiliere(filiere);
      setFormData({
        name: filiere.name,
        code: filiere.code,
        formation_ids: filiere.formation_ids || []
      });
    } else {
      setEditingFiliere(null);
      setFormData({ name: '', code: '', formation_ids: [] });
    }
    setDialogOpen(true);
  };

  const toggleFormation = (formationId) => {
    setFormData(prev => ({
      ...prev,
      formation_ids: prev.formation_ids.includes(formationId)
        ? prev.formation_ids.filter(id => id !== formationId)
        : [...prev.formation_ids, formationId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Le nom et le code sont obligatoires');
      return;
    }
    
    if (formData.formation_ids.length === 0) {
      toast.error('Veuillez sélectionner au moins une formation');
      return;
    }
    
    setSaving(true);
    try {
      if (editingFiliere) {
        await updateFiliere(editingFiliere.id, formData);
        toast.success('Filière modifiée');
      } else {
        await createFiliere(formData);
        toast.success('Filière créée');
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
    if (!deleteDialog.filiere) return;
    
    try {
      await deleteFiliere(deleteDialog.filiere.id);
      toast.success('Filière supprimée');
      setDeleteDialog({ open: false, filiere: null });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="filieres-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Filières</h1>
          <p className="text-slate-500 mt-1">Gérer les filières liées aux formations</p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-filiere-btn">
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
          ) : filieres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Layers size={48} className="mb-4" />
              <p>Aucune filière enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Formations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filieres.map((filiere) => (
                  <TableRow key={filiere.id} data-testid={`filiere-row-${filiere.id}`}>
                    <TableCell className="font-mono">{filiere.code}</TableCell>
                    <TableCell className="font-medium max-w-[300px] truncate">{filiere.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {filiere.formations?.map(f => (
                          <Badge key={f.id} variant="secondary" className="text-xs">{f.code}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(filiere)}>
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => setDeleteDialog({ open: true, filiere })}
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
            <DialogTitle>{editingFiliere ? 'Modifier la filière' : 'Ajouter une filière'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: IDA, FCGE"
                data-testid="filiere-code-input"
              />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Informatique Développeur d'Application"
                data-testid="filiere-name-input"
              />
            </div>
            <div>
              <Label className="mb-3 block">Formations associées *</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                {formations.map((formation) => (
                  <div key={formation.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`formation-${formation.id}`}
                      checked={formData.formation_ids.includes(formation.id)}
                      onCheckedChange={() => toggleFormation(formation.id)}
                    />
                    <Label htmlFor={`formation-${formation.id}`} className="cursor-pointer">
                      {formation.name} ({formation.code})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="save-filiere-btn">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingFiliere ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, filiere: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-4">Êtes-vous sûr de vouloir supprimer la filière "{deleteDialog.filiere?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, filiere: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
