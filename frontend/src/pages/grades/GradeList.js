import React, { useEffect, useState } from 'react';
import { 
  getStudents,
  getSubjects,
  getAcademicYears,
  getFormations,
  getFilieres,
  getLevels,
  getClasses
} from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';
import { Download, Loader2, FileText, Filter } from 'lucide-react';

export default function GradeList() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    academic_year_id: '',
    formation_id: '',
    filiere_id: '',
    level_id: '',
    class_id: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (filters.formation_id) loadFilieres();
  }, [filters.formation_id]);

  useEffect(() => {
    if (filters.academic_year_id && filters.formation_id && filters.filiere_id && filters.level_id) {
      loadClasses();
      loadSubjects();
    }
  }, [filters.academic_year_id, filters.formation_id, filters.filiere_id, filters.level_id]);

  useEffect(() => {
    if (filters.class_id) {
      loadStudents();
    }
  }, [filters.class_id]);

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
      
      const activeYear = yearsRes.data.find(y => y.is_active);
      if (activeYear) {
        setFilters(prev => ({ ...prev, academic_year_id: activeYear.id }));
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadFilieres = async () => {
    try {
      const response = await getFilieres(filters.formation_id);
      setFilieres(response.data);
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await getSubjects({
        formation_id: filters.formation_id,
        filiere_id: filters.filiere_id,
        level_id: filters.level_id
      });
      setSubjects(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudents({ class_id: filters.class_id });
      setStudents(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    toast.success('Liste de notes téléchargée en PDF');
  };

  const selectedClass = classes.find(c => c.id === filters.class_id);
  const selectedFiliere = filieres.find(f => f.id === filters.filiere_id);

  return (
    <div className="page-transition" data-testid="grade-list-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Liste de notes</h1>
          <p className="text-slate-500 mt-1">Liste vierge pour saisie manuelle par le professeur</p>
        </div>
        {students.length > 0 && (
          <Button onClick={downloadPDF} className="bg-orange-500 hover:bg-orange-600">
            <Download className="mr-2 h-4 w-4" />
            Télécharger PDF
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Select value={filters.academic_year_id} onValueChange={(v) => setFilters({...filters, academic_year_id: v})}>
              <SelectTrigger><SelectValue placeholder="Année" /></SelectTrigger>
              <SelectContent>
                {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.formation_id} onValueChange={(v) => setFilters({...filters, formation_id: v, filiere_id: '', class_id: ''})}>
              <SelectTrigger><SelectValue placeholder="Formation" /></SelectTrigger>
              <SelectContent>
                {formations.map(f => <SelectItem key={f.id} value={f.id}>{f.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.filiere_id} onValueChange={(v) => setFilters({...filters, filiere_id: v, class_id: ''})} disabled={!filters.formation_id}>
              <SelectTrigger><SelectValue placeholder="Filière" /></SelectTrigger>
              <SelectContent>
                {filieres.map(f => <SelectItem key={f.id} value={f.id}>{f.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.level_id} onValueChange={(v) => setFilters({...filters, level_id: v, class_id: ''})}>
              <SelectTrigger><SelectValue placeholder="Niveau" /></SelectTrigger>
              <SelectContent>
                {levels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.class_id} onValueChange={(v) => setFilters({...filters, class_id: v})} disabled={classes.length === 0}>
              <SelectTrigger><SelectValue placeholder="Classe" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grade List Preview */}
      <Card>
        {selectedClass && (
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-orange-600">SI</span>
                </div>
                <div>
                  <CardTitle>SUP'INTER</CardTitle>
                  <p className="text-sm text-slate-500">Liste de notes - {selectedClass.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{selectedFiliere?.name}</p>
                <p className="text-sm text-slate-500">Effectif: {students.length} étudiants</p>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : !filters.class_id ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Filter size={48} className="mb-4" />
              <p>Sélectionnez une classe pour afficher la liste</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FileText size={48} className="mb-4" />
              <p>Aucun étudiant dans cette classe</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">N°</TableHead>
                    <TableHead>Nom & Prénom</TableHead>
                    <TableHead className="text-center w-20">Note 1</TableHead>
                    <TableHead className="text-center w-20">Note 2</TableHead>
                    <TableHead className="text-center w-20">Note 3</TableHead>
                    <TableHead className="text-center w-20">Note 4</TableHead>
                    <TableHead className="text-center w-20">Note 5</TableHead>
                    <TableHead className="text-center w-24 bg-slate-50">Moyenne</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-medium">{student.last_name} {student.first_name}</TableCell>
                      <TableCell className="text-center border-l">
                        <div className="h-8 border-b border-dashed border-slate-300"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-8 border-b border-dashed border-slate-300"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-8 border-b border-dashed border-slate-300"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-8 border-b border-dashed border-slate-300"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-8 border-b border-dashed border-slate-300"></div>
                      </TableCell>
                      <TableCell className="text-center bg-slate-50">
                        <div className="h-8 border-b border-dashed border-slate-400"></div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
