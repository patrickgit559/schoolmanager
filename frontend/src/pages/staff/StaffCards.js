import React, { useEffect, useState } from 'react';
import { 
  getStaff,
  getAcademicYears,
  getCampuses,
  createArchive
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Download, Loader2, IdCard } from 'lucide-react';

export default function StaffCards() {
  const { user, isFounder } = useAuth();
  const [staff, setStaff] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) loadStaff();
  }, [selectedYear, selectedCampus]);

  const loadInitialData = async () => {
    try {
      const [yearsRes, campusesRes] = await Promise.all([
        getAcademicYears(),
        getCampuses()
      ]);
      setAcademicYears(yearsRes.data);
      setCampuses(campusesRes.data);
      
      const activeYear = yearsRes.data.find(y => y.is_active);
      if (activeYear) setSelectedYear(activeYear.id);
      
      if (!isFounder() && user?.campus_id) {
        setSelectedCampus(user.campus_id);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const params = { academic_year_id: selectedYear };
      if (selectedCampus) params.campus_id = selectedCampus;
      
      const response = await getStaff(params);
      setStaff(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCards = async () => {
    try {
      for (const member of staff) {
        await createArchive({
          document_type: 'staff_card',
          student_id: member.id, // Using same field for staff
          academic_year_id: selectedYear,
          campus_id: member.campus_id,
          downloaded_by: user?.name || 'Utilisateur'
        });
      }
      
      toast.success(`${staff.length} cartes professionnelles téléchargées`);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="page-transition" data-testid="staff-cards-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cartes professionnelles</h1>
          <p className="text-slate-500 mt-1">Générer les cartes du personnel</p>
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
            {isFounder() && (
              <div className="w-48">
                <label className="text-sm font-medium text-slate-700 block mb-2">Campus</label>
                <Select value={selectedCampus || 'all'} onValueChange={(v) => setSelectedCampus(v === 'all' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Tous les campus" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {campuses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {staff.length > 0 && (
              <Button onClick={downloadCards} className="bg-orange-500 hover:bg-orange-600">
                <Download className="mr-2 h-4 w-4" />
                Télécharger les cartes ({staff.length})
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
            Aperçu des cartes professionnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <IdCard size={48} className="mb-4" />
              <p>Aucun personnel enregistré</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map(member => (
                <div key={member.id} className="border rounded-lg overflow-hidden shadow-sm">
                  {/* Card */}
                  <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-4 text-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-blue-300">RÉPUBLIQUE DE CÔTE D'IVOIRE</p>
                        <p className="font-bold">SUP'INTER</p>
                        <p className="text-xs text-blue-200">{member.campus_name}</p>
                      </div>
                      <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center">
                        <span className="font-bold text-sm">SI</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-16 h-20 bg-blue-600 rounded flex items-center justify-center">
                        {member.photo ? (
                          <img src={member.photo} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-2xl">{member.first_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{member.last_name}</p>
                        <p>{member.first_name}</p>
                        <p className="text-xs text-blue-300 mt-1">{member.birth_date} - {member.birth_place}</p>
                        <p className="text-xs text-orange-400 mt-2 font-semibold">{member.function}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-blue-700 text-xs text-blue-200">
                      <p>Validité: {academicYears.find(y => y.id === selectedYear)?.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
