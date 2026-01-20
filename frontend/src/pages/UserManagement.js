import React, { useEffect, useState } from 'react';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  getCampuses
} from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Users, Shield } from 'lucide-react';

const ROLES = [
  { value: 'founder', label: 'Fondateur', color: 'bg-purple-100 text-purple-700' },
  { value: 'director', label: 'Directeur', color: 'bg-blue-100 text-blue-700' },
  { value: 'accountant', label: 'Comptable', color: 'bg-green-100 text-green-700' },
  { value: 'it', label: 'Informaticien', color: 'bg-orange-100 text-orange-700' },
  { value: 'secretary', label: 'Secrétaire', color: 'bg-slate-100 text-slate-700' }
];

export default function UserManagement() {
  const { user: currentUser, isFounder } = useAuth();
  const [users, setUsers] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'secretary',
    campus_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, campusesRes] = await Promise.all([
        getUsers(),
        getCampuses()
      ]);
      setUsers(usersRes.data);
      setCampuses(campusesRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        role: user.role,
        campus_id: user.campus_id
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'secretary',
        campus_id: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.name || !formData.campus_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (!editingUser && !formData.password) {
      toast.error('Le mot de passe est obligatoire');
      return;
    }
    
    setSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        toast.success('Utilisateur modifié');
      } else {
        await createUser(formData);
        toast.success('Utilisateur créé');
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    
    try {
      await deleteUser(deleteDialog.user.id);
      toast.success('Utilisateur supprimé');
      setDeleteDialog({ open: false, user: null });
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getRoleBadge = (role) => {
    const r = ROLES.find(r => r.value === role);
    return r ? <Badge className={r.color}>{r.label}</Badge> : <Badge>{role}</Badge>;
  };

  return (
    <div className="page-transition" data-testid="users-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-500 mt-1">Gérer les accès au système</p>
        </div>
        <Button onClick={() => openDialog()} data-testid="add-user-btn">
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
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users size={48} className="mb-4" />
              <p>Aucun utilisateur enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                          {u.name?.charAt(0)}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>{u.campus_name}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openDialog(u)}
                        disabled={u.id === currentUser?.id}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => setDeleteDialog({ open: true, user: u })}
                        disabled={u.id === currentUser?.id}
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
            <DialogTitle>{editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nom complet *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nom et prénom"
                data-testid="user-name-input"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@supinter.edu"
                data-testid="user-email-input"
              />
            </div>
            <div>
              <Label>{editingUser ? 'Nouveau mot de passe (laisser vide pour garder l\'ancien)' : 'Mot de passe *'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                data-testid="user-password-input"
              />
            </div>
            <div>
              <Label>Rôle *</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger data-testid="user-role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Campus *</Label>
              <Select value={formData.campus_id} onValueChange={(v) => setFormData({ ...formData, campus_id: v })}>
                <SelectTrigger data-testid="user-campus-select">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving} data-testid="save-user-btn">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingUser ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="py-4">Êtes-vous sûr de vouloir supprimer l'utilisateur "{deleteDialog.user?.name}" ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
