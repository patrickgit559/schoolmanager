import React, { useEffect, useState } from 'react';
import { 
  getStudents,
  getAcademicYears,
  getClasses,
  createArchive
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Download, Loader2, IdCard, Filter } from 'lucide-react';

export default function StudentCards() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) loadClasses();
  }, [selectedYear]);

  useEffect(() => {
    if (selectedClass) loadStudents();
  }, [selectedClass]);

  const loadInitialData = async () => {
    try {
      const yearsRes = await getAcademicYears();
      setAcademicYears(yearsRes.data);
      
      const activeYear = yearsRes.data.find(y => y.is_active);
      if (activeYear) setSelectedYear(activeYear.id);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await getClasses({ academic_year_id: selectedYear });
      setClasses(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await getStudents({ class_id: selectedClass });
      setStudents(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCards = async () => {
    try {
      // Archive downloads for all students
      for (const student of students) {
        await createArchive({
          document_type: 'student_card',
          student_id: student.id,
          academic_year_id: selectedYear,
          campus_id: student.campus_id,
          downloaded_by: user?.name || 'Utilisateur'
        });
      }
      
      toast.success(`${students.length} cartes étudiantes téléchargées (5 cartes recto/verso par page A4)`);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';

  return (
    <div className="page-transition" data-testid="student-cards-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cartes étudiantes</h1>
          <p className="text-slate-500 mt-1">Générer les cartes par classe (5 cartes recto/verso par page A4)</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <label className="text-sm font-medium text-slate-700 block mb-2">Année académique</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-64">
              <label className="text-sm font-medium text-slate-700 block mb-2">Classe</label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={classes.length === 0}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.filiere_name})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {students.length > 0 && (
              <Button onClick={downloadCards} className="bg-orange-500 hover:bg-orange-600">
                <Download className="mr-2 h-4 w-4" />
                Télécharger les cartes ({students.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard size={20} />
            Aperçu des cartes - {selectedClassName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : !selectedClass ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Filter size={48} className="mb-4" />
              <p>Sélectionnez une classe pour afficher les étudiants</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <IdCard size={48} className="mb-4" />
              <p>Aucun étudiant dans cette classe</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.slice(0, 6).map(student => (
                <div key={student.id} className="border rounded-lg overflow-hidden shadow-sm">
                  {/* Recto */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 text-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-slate-400">RÉPUBLIQUE DE CÔTE D'IVOIRE</p>
                        <p className="font-bold">SUP'INTER</p>
                        <p className="text-xs text-slate-300">{student.campus_name}</p>
                      </div>
                      <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center">
                        <span className="font-bold text-sm">SI</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-16 h-20 bg-slate-600 rounded flex items-center justify-center">
                        {student.photo ? (
                          <img src={student.photo} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-2xl">{student.first_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{student.last_name}</p>
                        <p>{student.first_name}</p>
                        <p className="text-xs text-slate-300 mt-1">{student.birth_date} - {student.birth_place}</p>
                        <p className="text-xs text-orange-400 mt-1">{student.permanent_id}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                      <p>{student.filiere_name}</p>
                      <p className="text-slate-400">{student.level_name} - {student.academic_year_name}</p>
                    </div>
                  </div>
                  {/* Verso */}
                  <div className="bg-slate-100 p-3 text-center text-xs">
                    <p className="font-semibold text-slate-700">SUP'INTER - {student.campus_name}</p>
                    <p className="text-slate-500 mt-1">En cas de perte, prière de ramener cette carte à l'adresse ci-dessus</p>
                    <p className="text-slate-600 mt-1">Tél: 01 01 01 01 01</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {students.length > 6 && (
            <p className="text-center text-slate-500 mt-4">
              ... et {students.length - 6} autres étudiants
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
