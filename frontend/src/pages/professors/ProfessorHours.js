import React, { useEffect, useState } from 'react';
import { 
  getProfessorHours, 
  createProfessorHours, 
  updateProfessorHours, 
  deleteProfessorHours,
  getProfessors,
  getAcademicYears,
  getFormations,
  getFilieres,
  getLevels,
  getClasses
} from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Loader2, Clock, Download } from 'lucide-react';

export default function ProfessorHours() {
  const [hours, setHours] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingHours, setEditingHours] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  
  const [formData, setFormData] = useState({
    professor_id: '',
    academic_year_id: '',
    formation_id: '',
    filiere_id: '',
    level_id: '',
    class_id: '',
    total_hours_planned: 0,
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '10:00',
    hours_done: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadHours();
    }
  }, [selectedYear]);

  useEffect(() => {
    if (formData.formation_id) {
      loadFilieres();
    }
  }, [formData.formation_id]);

  useEffect(() => {
    if (formData.academic_year_id && formData.formation_id && formData.filiere_id && formData.level_id) {
      loadClasses();
    }
  }, [formData.academic_year_id, formData.formation_id, formData.filiere_id, formData.level_id]);

  const loadInitialData = async () => {
    try {
      const [professorsRes, yearsRes, formationsRes, levelsRes] = await Promise.all([
        getProfessors(),
        getAcademicYears(),
        getFormations(),
        getLevels()
      ]);
      setProfessors(professorsRes.data);
      setAcademicYears(yearsRes.data);
      setFormations(formationsRes.data);
      setLevels(levelsRes.data);
      
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

  const loadFilieres = async () => {
    try {
      const response = await getFilieres(formData.formation_id);
      setFilieres(response.data);
    } catch (error) {
      console.error('Error loading filieres:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await getClasses({
        academic_year_id: formData.academic_year_id,
        formation_id: formData.formation_id,
        filiere_id: formData.filiere_id,
        level_id: formData.level_id
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadHours = async () => {
    try {
      const response = await getProfessorHours({ academic_year_id: selectedYear });
      setHours(response.data);
    } catch (error) {
      console.error('Error loading hours:', error);
    }
  };

  const openDialog = (hourEntry = null) => {
    if (hourEntry) {
      setEditingHours(hourEntry);
      setFormData({
        professor_id: hourEntry.professor_id,
        academic_year_id: hourEntry.academic_year_id,
        formation_id: hourEntry.formation_id,
        filiere_id: hourEntry.filiere_id,
        level_id: hourEntry.level_id,
        class_id: hourEntry.class_id,
        total_hours_planned: hourEntry.total_hours_planned,
        date: hourEntry.date,
        start_time: hourEntry.start_time,
        end_time: hourEntry.end_time,
        hours_done: hourEntry.total_hours_done
      });
    } else {
      setEditingHours(null);
      setFormData({
        professor_id: '',
        academic_year_id: selectedYear,
        formation_id: '',
        filiere_id: '',
        level_id: '',
        class_id: '',
        total_hours_planned: 0,
        date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '10:00',
        hours_done: 0
      });
    }
    setDialogOpen(true);
  };

  const calculateHours = () => {
    const start = formData.start_time.split(':');
    const end = formData.end_time.split(':');
    const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
    const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
    return Math.max(0, (endMinutes - startMinutes) / 60);
  };

  const handleSubmit = async () => {
    if (!formData.professor_id) {
      toast.error('Veuillez sélectionner un professeur');
      return;
    }
    
    const hoursCalculated = calculateHours();
    const dataToSend = {
      ...formData,
      hours_done: editingHours ? formData.hours_done + hoursCalculated : hoursCalculated
    };
    
    setSaving(true);
    try {
      if (editingHours) {
        await updateProfessorHours(editingHours.id, dataToSend);
        toast.success('Heures modifiées');
      } else {
        await createProfessorHours(dataToSend);
        toast.success('Heures enregistrées');
      }
      setDialogOpen(false);
      loadHours();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette entrée ?')) return;
    
    try {
      await deleteProfessorHours(id);
      toast.success('Entrée supprimée');
      loadHours();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-transition" data-testid="professor-hours-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suivi des heures</h1>
          <p className="text-slate-500 mt-1">Gérer les heures des professeurs</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Année" /></SelectTrigger>
            <SelectContent>
              {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" />PDF</Button>
          <Button onClick={() => openDialog()} data-testid="add-hours-btn">
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
          ) : hours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Clock size={48} className="mb-4" />
              <p>Aucune heure enregistrée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professeur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Horaire</TableHead>
                  <TableHead>Heures prévues</TableHead>
                  <TableHead>Heures effectuées</TableHead>
                  <TableHead>Heures restantes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hours.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.professor_name}</TableCell>
                    <TableCell>{new Date(h.date).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{h.start_time} - {h.end_time}</TableCell>
                    <TableCell>{h.total_hours_planned}h</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">{h.total_hours_done}h</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={h.hours_remaining > 0 ? "outline" : "secondary"}>
                        {h.hours_remaining}h
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(h)}><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(h.id)}><Trash2 size={16} /></Button>
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
            <DialogTitle>{editingHours ? 'Modifier les heures' : 'Ajouter des heures'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Professeur *</Label>
              <Select value={formData.professor_id} onValueChange={(v) => setFormData({...formData, professor_id: v})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {professors.map(p => <SelectItem key={p.id} value={p.id}>{p.last_name} {p.first_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Formation</Label>
                <Select value={formData.formation_id} onValueChange={(v) => setFormData({...formData, formation_id: v, filiere_id: '', class_id: ''})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {formations.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Filière</Label>
                <Select value={formData.filiere_id} onValueChange={(v) => setFormData({...formData, filiere_id: v, class_id: ''})} disabled={!formData.formation_id}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {filieres.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Niveau</Label>
                <Select value={formData.level_id} onValueChange={(v) => setFormData({...formData, level_id: v, class_id: ''})}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Classe</Label>
                <Select value={formData.class_id} onValueChange={(v) => setFormData({...formData, class_id: v})} disabled={classes.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Heures à effectuer (total)</Label>
              <Input type="number" min="0" value={formData.total_hours_planned} onChange={(e) => setFormData({...formData, total_hours_planned: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <Label>Heure début</Label>
                <Input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
              </div>
              <div>
                <Label>Heure fin</Label>
                <Input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} />
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Heures à ajouter: <strong>{calculateHours()}h</strong></p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
