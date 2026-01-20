import React, { useEffect, useState } from 'react';
import { 
  getCampuses, 
  createCampus, 
  updateCampus, 
  deleteCampus 
} from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Building2 } from 'lucide-react';

export default function CampusManagement() {
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, campus: null });
  const [saving, setSaving] = useState(false);
  const [editingCampus, setEditingCampus] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });

  useEffect(() => {
    loadCampuses();
  }, []);

  const loadCampuses = async () => {
    try {
      const response = await getCampuses();
      setCampuses(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (campus = null) => {
    if (campus) {
      setEditingCampus(campus);
      setFormData({
        name: campus.name,
        address: campus.address || '',
        phone: campus.phone || ''
      });
    } else {
      setEditingCampus(null);
      setFormData({ name: '', address: '', phone: '' });
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
      if (editingCampus) {
        await updateCampus(editingCampus.id, formData);
        toast.success('Campus modifié');
      } else {
        await createCampus(formData);
        toast.success('Campus créé');
      }
      setDialogOpen(false);
      loadCampuses();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.campus) return;
    
    try {
      await deleteCampus(deleteDialog.campus.id);
      toast.success('Campus supprimé');
      setDeleteDialog({ open: false, campus: null });
      loadCampuses();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="campus-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campus</h1>
          <p className="text-slate-500 mt-1">Gérer les campus de l'établissement</p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-campus-btn">
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
          ) : campuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Building2 size={48} className="mb-4" />
              <p>Aucun campus enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campuses.map((campus) => (
                  <TableRow key={campus.id} data-testid={`campus-row-${campus.id}`}>
                    <TableCell className="font-medium">{campus.name}</TableCell>
                    <TableCell>{campus.address || '-'}</TableCell>
                    <TableCell>{campus.phone || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openDialog(campus)}
                        data-testid={`edit-campus-${campus.id}`}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500"
                        onClick={() => setDeleteDialog({ open: true, campus })}
                        data-testid={`delete-campus-${campus.id}`}
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
            <DialogTitle>{editingCampus ? 'Modifier le campus' : 'Ajouter un campus'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom du campus"
                data-testid="campus-name-input"
              />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Adresse"
                data-testid="campus-address-input"
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Téléphone"
                data-testid="campus-phone-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="save-campus-btn">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingCampus ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, campus: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-4">Êtes-vous sûr de vouloir supprimer le campus "{deleteDialog.campus?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, campus: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-campus">Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
