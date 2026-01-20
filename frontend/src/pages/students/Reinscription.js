import React, { useEffect, useState } from 'react';
import { 
  getStudents, 
  reenrollStudent,
  getAcademicYears,
  getFormations,
  getFilieres,
  getLevels,
  getClasses
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Search, RefreshCw, Loader2, Check } from 'lucide-react';

export default function StudentReinscription() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Dropdown data
  const [academicYears, setAcademicYears] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Reenroll form
  const [reenrollData, setReenrollData] = useState({
    academic_year_id: '',
    formation_id: '',
    filiere_id: '',
    level_id: '',
    class_id: '',
    status: 'non_affecté'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (reenrollData.formation_id) {
      loadFilieres();
    }
  }, [reenrollData.formation_id]);

  useEffect(() => {
    if (reenrollData.academic_year_id && reenrollData.formation_id && reenrollData.filiere_id && reenrollData.level_id) {
      loadClasses();
    }
  }, [reenrollData.academic_year_id, reenrollData.formation_id, reenrollData.filiere_id, reenrollData.level_id]);

  const loadInitialData = async () => {
    try {
      const [yearsRes, formationsRes, levelsRes] = await Promise.all([
        getAcademicYears(),
        getFormations(),
        getLevels()
      ]);
      
      setAcademicYears(yearsRes.data);
      setFormations(formationsRes.data);
      setLevels(levelsRes.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    }
  };

  const loadFilieres = async () => {
    try {
      const response = await getFilieres(reenrollData.formation_id);
      setFilieres(response.data);
    } catch (error) {
      console.error('Error loading filieres:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await getClasses({
        academic_year_id: reenrollData.academic_year_id,
        formation_id: reenrollData.formation_id,
        filiere_id: reenrollData.filiere_id,
        level_id: reenrollData.level_id
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      toast.error('Veuillez entrer un terme de recherche');
      return;
    }
    
    setLoading(true);
    try {
      const response = await getStudents({ search });
      setStudents(response.data);
      if (response.data.length === 0) {
        toast.info('Aucun étudiant trouvé');
      }
    } catch (error) {
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setReenrollData({
      academic_year_id: '',
      formation_id: student.formation_id,
      filiere_id: student.filiere_id,
      level_id: '',
      class_id: '',
      status: 'non_affecté'
    });
    setDialogOpen(true);
  };

  const handleReenrollChange = (field, value) => {
    setReenrollData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'formation_id') {
        newData.filiere_id = '';
        newData.class_id = '';
        setFilieres([]);
        setClasses([]);
      }
      if (field === 'filiere_id' || field === 'level_id') {
        newData.class_id = '';
        setClasses([]);
      }
      
      return newData;
    });
  };

  const handleReenroll = async () => {
    if (!selectedStudent) return;
    
    if (!reenrollData.academic_year_id || !reenrollData.formation_id || !reenrollData.filiere_id || !reenrollData.level_id || !reenrollData.class_id) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    setSaving(true);
    try {
      await reenrollStudent(selectedStudent.id, reenrollData);
      toast.success('Réinscription effectuée avec succès');
      setDialogOpen(false);
      setSelectedStudent(null);
      setStudents([]);
      setSearch('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la réinscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-transition" data-testid="reinscription-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Réinscription</h1>
        <p className="text-slate-500 mt-1">Rechercher et réinscrire un étudiant pour une nouvelle année</p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, matricule ou identifiant permanent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="search-student-input"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} data-testid="search-btn">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Résultats ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  data-testid={`result-${student.id}`}
                >
                  <div className="flex items-center gap-4">
                    {student.photo ? (
                      <img src={student.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                        {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{student.last_name} {student.first_name}</p>
                      <p className="text-sm text-slate-500">
                        {student.matricule} | {student.permanent_id}
                      </p>
                      <p className="text-xs text-slate-400">
                        {student.formation_name} - {student.level_name} ({student.academic_year_name})
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => selectStudent(student)}
                    data-testid={`select-${student.id}`}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réinscrire
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reenroll Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réinscription de {selectedStudent?.last_name} {selectedStudent?.first_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Nouvelle année académique *</Label>
              <Select 
                value={reenrollData.academic_year_id} 
                onValueChange={(v) => handleReenrollChange('academic_year_id', v)}
              >
                <SelectTrigger data-testid="reenroll-year">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(y => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Formation *</Label>
              <Select 
                value={reenrollData.formation_id} 
                onValueChange={(v) => handleReenrollChange('formation_id', v)}
              >
                <SelectTrigger data-testid="reenroll-formation">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
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
                value={reenrollData.filiere_id} 
                onValueChange={(v) => handleReenrollChange('filiere_id', v)}
                disabled={!reenrollData.formation_id}
              >
                <SelectTrigger data-testid="reenroll-filiere">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {filieres.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Niveau *</Label>
              <Select 
                value={reenrollData.level_id} 
                onValueChange={(v) => handleReenrollChange('level_id', v)}
              >
                <SelectTrigger data-testid="reenroll-level">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Classe *</Label>
              <Select 
                value={reenrollData.class_id} 
                onValueChange={(v) => handleReenrollChange('class_id', v)}
                disabled={classes.length === 0}
              >
                <SelectTrigger data-testid="reenroll-class">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Statut</Label>
              <Select 
                value={reenrollData.status} 
                onValueChange={(v) => handleReenrollChange('status', v)}
              >
                <SelectTrigger data-testid="reenroll-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="affecté">Affecté</SelectItem>
                  <SelectItem value="non_affecté">Non affecté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleReenroll} disabled={saving} data-testid="confirm-reenroll">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Valider la réinscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
