import React, { useEffect, useState } from 'react';
import { 
  getStudents, 
  deleteStudent,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Search, Download, Eye, Edit, Trash2, Loader2, Users, FileSpreadsheet, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentList() {
  const { user, isFounder } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, student: null });
  
  // Filters
  const [academicYears, setAcademicYears] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [filters, setFilters] = useState({
    academic_year_id: '',
    formation_id: '',
    filiere_id: '',
    level_id: '',
    class_id: ''
  });

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [filters, search]);

  useEffect(() => {
    if (filters.formation_id) {
      loadFilieres();
    }
  }, [filters.formation_id]);

  useEffect(() => {
    if (filters.filiere_id && filters.level_id && filters.academic_year_id) {
      loadClasses();
    }
  }, [filters.filiere_id, filters.level_id, filters.academic_year_id]);

  const loadFilterData = async () => {
    try {
      const [yearsRes, formationsRes, levelsRes] = await Promise.all([
        getAcademicYears(),
        getFormations(),
        getLevels()
      ]);
      
      setAcademicYears(yearsRes.data);
      setFormations(formationsRes.data);
      setLevels(levelsRes.data);
      
      const activeYear = yearsRes.data.find(y => y.is_active);
      if (activeYear) {
        setFilters(prev => ({ ...prev, academic_year_id: activeYear.id }));
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  const loadFilieres = async () => {
    try {
      const response = await getFilieres(filters.formation_id);
      setFilieres(response.data);
    } catch (error) {
      console.error('Error loading filieres:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await getClasses({
        academic_year_id: filters.academic_year_id,
        formation_id: filters.formation_id,
        filiere_id: filters.filiere_id,
        level_id: filters.level_id
      });
      setClasses(response.data);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (search) params.search = search;
      
      const response = await getStudents(params);
      setStudents(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      
      // Reset dependent filters
      if (field === 'formation_id') {
        newFilters.filiere_id = '';
        newFilters.class_id = '';
        setFilieres([]);
        setClasses([]);
      }
      if (field === 'filiere_id' || field === 'level_id') {
        newFilters.class_id = '';
        setClasses([]);
      }
      
      return newFilters;
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog.student) return;
    
    try {
      await deleteStudent(deleteDialog.student.id);
      toast.success('Étudiant supprimé');
      setDeleteDialog({ open: false, student: null });
      loadStudents();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportToCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Formation', 'Filière', 'Niveau', 'Classe', 'Téléphone', 'Email'];
    const rows = students.map(s => [
      s.matricule,
      s.last_name,
      s.first_name,
      s.formation_name,
      s.filiere_name,
      s.level_name,
      s.class_name,
      s.phone,
      s.email
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etudiants_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export réussi');
  };

  return (
    <div className="page-transition" data-testid="student-list-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Liste des étudiants</h1>
          <p className="text-slate-500 mt-1">
            <span className="font-medium text-slate-700">{students.length}</span> étudiant(s) trouvé(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="export-csv-btn">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" data-testid="export-pdf-btn">
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder="Rechercher par nom, matricule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <Select value={filters.academic_year_id} onValueChange={(v) => handleFilterChange('academic_year_id', v)}>
              <SelectTrigger data-testid="filter-year">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(y => (
                  <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.formation_id || 'all'} onValueChange={(v) => handleFilterChange('formation_id', v === 'all' ? '' : v)}>
              <SelectTrigger data-testid="filter-formation">
                <SelectValue placeholder="Formation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {formations.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.filiere_id || 'all'} 
              onValueChange={(v) => handleFilterChange('filiere_id', v === 'all' ? '' : v)}
              disabled={!filters.formation_id}
            >
              <SelectTrigger data-testid="filter-filiere">
                <SelectValue placeholder="Filière" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {filieres.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filters.level_id || 'all'} onValueChange={(v) => handleFilterChange('level_id', v === 'all' ? '' : v)}>
              <SelectTrigger data-testid="filter-level">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {levels.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users size={48} className="mb-4" />
              <p>Aucun étudiant trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Nom & Prénom</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Filière</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} data-testid={`student-row-${student.id}`}>
                      <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {student.photo ? (
                            <img src={student.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs">
                              {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{student.last_name} {student.first_name}</p>
                            <p className="text-xs text-slate-500">{student.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.formation_name}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{student.filiere_name}</TableCell>
                      <TableCell>{student.level_name}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'affecté' ? 'default' : 'secondary'}>
                          {student.status === 'affecté' ? 'Affecté' : 'Non affecté'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/students/${student.id}`)}
                            data-testid={`view-student-${student.id}`}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/students/${student.id}/edit`)}
                            data-testid={`edit-student-${student.id}`}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setDeleteDialog({ open: true, student })}
                            data-testid={`delete-student-${student.id}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, student: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'étudiant {deleteDialog.student?.last_name} {deleteDialog.student?.first_name} ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, student: null })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete">
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
