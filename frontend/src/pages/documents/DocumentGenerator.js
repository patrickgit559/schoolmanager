import React, { useEffect, useState } from 'react';
import { 
  getStudents,
  getAcademicYears,
  getFormations,
  getFilieres,
  getLevels,
  getClasses,
  createArchive
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { toast } from 'sonner';
import { Download, Loader2, FileText, Filter } from 'lucide-react';

export default function DocumentGenerator({ documentType, title, description }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
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

  const downloadDocument = async (student) => {
    try {
      await createArchive({
        document_type: documentType,
        student_id: student.id,
        academic_year_id: filters.academic_year_id,
        campus_id: student.campus_id,
        downloaded_by: user?.name || 'Utilisateur'
      });
      
      toast.success(`${title} de ${student.last_name} ${student.first_name} téléchargé`);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="page-transition" data-testid={`${documentType}-page`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1">{description}</p>
        </div>
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

      {/* Students Table */}
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
              <FileText size={48} className="mb-4" />
              <p>Aucun étudiant dans cette classe</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom & Prénom</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono">{student.matricule}</TableCell>
                    <TableCell className="font-medium">{student.last_name} {student.first_name}</TableCell>
                    <TableCell>{student.formation_name}</TableCell>
                    <TableCell>{student.filiere_name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => downloadDocument(student)}>
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Export individual document pages
export const CertificateFrequentation = () => (
  <DocumentGenerator 
    documentType="certificate_frequentation"
    title="Certificat de fréquentation"
    description="Générer un certificat attestant la fréquentation de l'établissement"
  />
);

export const CertificateScolarite = () => (
  <DocumentGenerator 
    documentType="certificate_scolarite"
    title="Certificat de scolarité"
    description="Générer un certificat attestant l'inscription de l'étudiant"
  />
);

export const CertificateAdmission = () => (
  <DocumentGenerator 
    documentType="certificate_admission"
    title="Certificat d'admission"
    description="Générer un certificat d'admission de l'étudiant"
  />
);

export const AttestationAuthentification = () => (
  <DocumentGenerator 
    documentType="attestation_auth"
    title="Attestation d'authentification"
    description="Générer une attestation d'authentification de documents"
  />
);
