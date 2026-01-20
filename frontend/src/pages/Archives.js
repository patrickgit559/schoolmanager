import React, { useEffect, useState } from 'react';
import { getArchives, getAcademicYears } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Loader2, Archive, FileText, Award, IdCard } from 'lucide-react';
import { toast } from 'sonner';

const DOCUMENT_TYPES = {
  'certificate_frequentation': { label: 'Certificat de fréquentation', icon: FileText },
  'certificate_scolarite': { label: 'Certificat de scolarité', icon: FileText },
  'certificate_admission': { label: 'Certificat d\'admission', icon: FileText },
  'attestation_auth': { label: 'Attestation d\'authentification', icon: FileText },
  'bulletin': { label: 'Bulletin', icon: FileText },
  'diploma': { label: 'Diplôme', icon: Award },
  'student_card': { label: 'Carte étudiante', icon: IdCard },
  'staff_card': { label: 'Carte professionnelle', icon: IdCard }
};

export default function Archives() {
  const { user, isFounder } = useAuth();
  const [archives, setArchives] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadArchives();
    }
  }, [selectedYear, selectedType]);

  const loadAcademicYears = async () => {
    try {
      const response = await getAcademicYears();
      setAcademicYears(response.data);
      const activeYear = response.data.find(y => y.is_active);
      if (activeYear) {
        setSelectedYear(activeYear.id);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
      setLoading(false);
    }
  };

  const loadArchives = async () => {
    setLoading(true);
    try {
      const params = { academic_year_id: selectedYear };
      if (selectedType) params.document_type = selectedType;
      
      const response = await getArchives(params);
      setArchives(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentLabel = (type) => {
    return DOCUMENT_TYPES[type]?.label || type;
  };

  return (
    <div className="page-transition" data-testid="archives-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Archives</h1>
          <p className="text-slate-500 mt-1">Historique des téléchargements de documents</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map(y => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedType || 'all'} onValueChange={(v) => setSelectedType(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Type de document" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {Object.entries(DOCUMENT_TYPES).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : archives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Archive size={48} className="mb-4" />
              <p>Aucune archive trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type de document</TableHead>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Téléchargé par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archives.map((archive) => (
                  <TableRow key={archive.id} data-testid={`archive-row-${archive.id}`}>
                    <TableCell>
                      {new Date(archive.downloaded_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getDocumentLabel(archive.document_type)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{archive.student_name}</TableCell>
                    <TableCell>{archive.downloaded_by}</TableCell>
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
