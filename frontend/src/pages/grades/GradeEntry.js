import React, { useEffect, useState } from 'react';
import { 
  getGrades, 
  createGrade, 
  updateGrade, 
  deleteGrade,
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
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';
import { Save, Loader2, BookOpen, Filter } from 'lucide-react';

export default function GradeEntry() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [academicYears, setAcademicYears] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [filters, setFilters] = useState({
    academic_year_id: '',
    formation_id: '',
    filiere_id: '',
    level_id: '',
    class_id: '',
    semester: '1'
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
      loadStudentsAndGrades();
    }
  }, [filters.class_id, filters.semester]);

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

  const loadStudentsAndGrades = async () => {
    setLoading(true);
    try {
      const [studentsRes, gradesRes] = await Promise.all([
        getStudents({ class_id: filters.class_id }),
        getGrades({ academic_year_id: filters.academic_year_id, semester: parseInt(filters.semester) })
      ]);
      
      setStudents(studentsRes.data);
      
      // Build grades map: { studentId_subjectId: value }
      const gradesMap = {};
      gradesRes.data.forEach(g => {
        gradesMap[`${g.student_id}_${g.subject_id}`] = { id: g.id, value: g.value };
      });
      setGrades(gradesMap);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId, subjectId, value) => {
    const key = `${studentId}_${subjectId}`;
    const numValue = parseFloat(value) || 0;
    setGrades(prev => ({
      ...prev,
      [key]: { ...prev[key], value: Math.min(20, Math.max(0, numValue)), changed: true }
    }));
  };

  const saveGrades = async () => {
    setSaving(true);
    try {
      const changedGrades = Object.entries(grades).filter(([, g]) => g.changed);
      
      for (const [key, grade] of changedGrades) {
        const [studentId, subjectId] = key.split('_');
        const gradeData = {
          student_id: studentId,
          subject_id: subjectId,
          semester: parseInt(filters.semester),
          academic_year_id: filters.academic_year_id,
          value: grade.value
        };
        
        if (grade.id) {
          await updateGrade(grade.id, gradeData);
        } else {
          await createGrade(gradeData);
        }
      }
      
      toast.success('Notes enregistrées');
      loadStudentsAndGrades();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const calculateAverage = (studentId) => {
    let total = 0;
    let coeffSum = 0;
    
    subjects.forEach(subject => {
      const key = `${studentId}_${subject.id}`;
      const grade = grades[key];
      if (grade && grade.value !== undefined) {
        total += grade.value * subject.coefficient;
        coeffSum += subject.coefficient;
      }
    });
    
    return coeffSum > 0 ? (total / coeffSum).toFixed(2) : '-';
  };

  return (
    <div className="page-transition" data-testid="grades-entry-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Saisie des moyennes</h1>
          <p className="text-slate-500 mt-1">Saisir les notes par classe et semestre</p>
        </div>
        <Button onClick={saveGrades} disabled={saving} data-testid="save-grades-btn">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
            <Select value={filters.semester} onValueChange={(v) => setFilters({...filters, semester: v})}>
              <SelectTrigger><SelectValue placeholder="Semestre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semestre 1</SelectItem>
                <SelectItem value="2">Semestre 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : !filters.class_id ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Filter size={48} className="mb-4" />
              <p>Sélectionnez une classe pour afficher les étudiants</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <BookOpen size={48} className="mb-4" />
              <p>Aucun étudiant dans cette classe</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white">Étudiant</TableHead>
                    {subjects.map(s => (
                      <TableHead key={s.id} className="text-center min-w-[100px]">
                        <div>{s.code}</div>
                        <div className="text-xs font-normal text-slate-400">Coef: {s.coefficient}</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center bg-slate-50">Moyenne</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="sticky left-0 bg-white font-medium">
                        {student.last_name} {student.first_name}
                      </TableCell>
                      {subjects.map(subject => {
                        const key = `${student.id}_${subject.id}`;
                        const grade = grades[key];
                        return (
                          <TableCell key={subject.id} className="text-center p-1">
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.25"
                              value={grade?.value ?? ''}
                              onChange={(e) => handleGradeChange(student.id, subject.id, e.target.value)}
                              className="w-16 text-center mx-auto"
                              data-testid={`grade-${student.id}-${subject.id}`}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold bg-slate-50">
                        {calculateAverage(student.id)}
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
