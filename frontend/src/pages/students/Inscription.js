import React, { useEffect, useState, useRef } from 'react';
import { 
  getStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  getAcademicYears,
  getFormations,
  getFilieres,
  getLevels,
  getClasses,
  getCampuses
} from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { UserPlus, Loader2, Save, Upload, X } from 'lucide-react';

export default function StudentInscription() {
  const { user, isFounder } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  // Dropdown data
  const [academicYears, setAcademicYears] = useState([]);
  const [formations, setFormations] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classes, setClasses] = useState([]);
  const [campuses, setCampuses] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    permanent_id: '',
    photo: '',
    matricule_bac: '',
    numero_table_bac: '',
    campus_id: '',
    academic_year_id: '',
    formation_id: '',
    filiere_id: '',
    level_id: '',
    class_id: '',
    status: 'non_affecté',
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    gender: '',
    phone: '',
    email: '',
    nationality: 'Ivoirienne',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    tuition_amount: 0,
    is_exonerated: false
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.formation_id) {
      loadFilieres(formData.formation_id);
    }
  }, [formData.formation_id]);

  useEffect(() => {
    if (formData.academic_year_id && formData.formation_id && formData.filiere_id && formData.level_id) {
      loadClasses();
    }
  }, [formData.academic_year_id, formData.formation_id, formData.filiere_id, formData.level_id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [yearsRes, formationsRes, levelsRes, campusesRes] = await Promise.all([
        getAcademicYears(),
        getFormations(),
        getLevels(),
        getCampuses()
      ]);
      
      setAcademicYears(yearsRes.data);
      setFormations(formationsRes.data);
      setLevels(levelsRes.data);
      setCampuses(campusesRes.data);
      
      // Set defaults
      const activeYear = yearsRes.data.find(y => y.is_active);
      if (activeYear) {
        setFormData(prev => ({ ...prev, academic_year_id: activeYear.id }));
      }
      
      if (!isFounder() && user?.campus_id) {
        setFormData(prev => ({ ...prev, campus_id: user.campus_id }));
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadFilieres = async (formationId) => {
    try {
      const response = await getFilieres(formationId);
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

  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si exonéré est coché, mettre le montant à 0
      if (field === 'is_exonerated' && value === true) {
        newData.tuition_amount = 0;
      }
      
      return newData;
    });
    
    // Reset dependent fields
    if (field === 'formation_id') {
      setFormData(prev => ({ ...prev, filiere_id: '', class_id: '' }));
      setFilieres([]);
      setClasses([]);
    }
    if (field === 'filiere_id' || field === 'level_id') {
      setFormData(prev => ({ ...prev, class_id: '' }));
      setClasses([]);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    
    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La photo ne doit pas dépasser 2 Mo');
      return;
    }
    
    // Convertir en base64
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, photo: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.permanent_id || !formData.first_name || !formData.last_name) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (formData.phone && formData.phone.length !== 10) {
      toast.error('Le numéro de téléphone doit contenir 10 chiffres');
      return;
    }

    setSaving(true);
    try {
      await createStudent(formData);
      toast.success('Étudiant inscrit avec succès');
      
      // Reset form
      setFormData({
        permanent_id: '',
        photo: '',
        matricule_bac: '',
        numero_table_bac: '',
        campus_id: isFounder() ? '' : user?.campus_id,
        academic_year_id: formData.academic_year_id,
        formation_id: '',
        filiere_id: '',
        level_id: '',
        class_id: '',
        status: 'non_affecté',
        first_name: '',
        last_name: '',
        birth_date: '',
        birth_place: '',
        gender: '',
        phone: '',
        email: '',
        nationality: 'Ivoirienne',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        tuition_amount: 0,
        is_exonerated: false
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="page-transition" data-testid="inscription-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inscription d&apos;un étudiant</h1>
          <p className="text-slate-500 mt-1">Enregistrer un nouvel étudiant dans le système</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations académiques */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Informations académiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Identifiant permanent *</Label>
                  <Input
                    value={formData.permanent_id}
                    onChange={(e) => handleChange('permanent_id', e.target.value)}
                    placeholder="Ex: MAKP0912050001"
                    required
                    data-testid="permanent-id-input"
                  />
                </div>
                
                {isFounder() && (
                  <div>
                    <Label>Campus *</Label>
                    <Select value={formData.campus_id} onValueChange={(v) => handleChange('campus_id', v)}>
                      <SelectTrigger data-testid="campus-select">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {campuses.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label>Année académique *</Label>
                  <Select value={formData.academic_year_id} onValueChange={(v) => handleChange('academic_year_id', v)}>
                    <SelectTrigger data-testid="year-select">
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
                  <Select value={formData.formation_id} onValueChange={(v) => handleChange('formation_id', v)}>
                    <SelectTrigger data-testid="formation-select">
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
                    value={formData.filiere_id} 
                    onValueChange={(v) => handleChange('filiere_id', v)}
                    disabled={!formData.formation_id}
                  >
                    <SelectTrigger data-testid="filiere-select">
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
                  <Select value={formData.level_id} onValueChange={(v) => handleChange('level_id', v)}>
                    <SelectTrigger data-testid="level-select">
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
                    value={formData.class_id} 
                    onValueChange={(v) => handleChange('class_id', v)}
                    disabled={classes.length === 0}
                  >
                    <SelectTrigger data-testid="class-select">
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
                  <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                    <SelectTrigger data-testid="status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="affecté">Affecté</SelectItem>
                      <SelectItem value="non_affecté">Non affecté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Matricule BAC</Label>
                  <Input
                    value={formData.matricule_bac}
                    onChange={(e) => handleChange('matricule_bac', e.target.value)}
                    placeholder="Matricule BAC"
                    data-testid="matricule-bac-input"
                  />
                </div>
                <div>
                  <Label>Numéro de table BAC</Label>
                  <Input
                    value={formData.numero_table_bac}
                    onChange={(e) => handleChange('numero_table_bac', e.target.value)}
                    placeholder="Numéro de table"
                    data-testid="table-bac-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="w-32 h-40 bg-slate-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
                  {formData.photo ? (
                    <>
                      <img src={formData.photo} alt="Photo" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        data-testid="remove-photo-btn"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <UserPlus className="text-slate-400" size={32} />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  data-testid="photo-file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  data-testid="upload-photo-btn"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {formData.photo ? 'Changer la photo' : 'Importer une photo'}
                </Button>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  JPG, PNG ou GIF (max 2 Mo)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informations personnelles */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nom *</Label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value.toUpperCase())}
                    placeholder="NOM"
                    required
                    data-testid="lastname-input"
                  />
                </div>
                <div>
                  <Label>Prénom *</Label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="Prénom"
                    required
                    data-testid="firstname-input"
                  />
                </div>
                <div>
                  <Label>Date de naissance *</Label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleChange('birth_date', e.target.value)}
                    required
                    data-testid="birthdate-input"
                  />
                </div>
                <div>
                  <Label>Lieu de naissance *</Label>
                  <Input
                    value={formData.birth_place}
                    onChange={(e) => handleChange('birth_place', e.target.value)}
                    placeholder="Lieu de naissance"
                    required
                    data-testid="birthplace-input"
                  />
                </div>
                <div>
                  <Label>Genre *</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                    <SelectTrigger data-testid="gender-select">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nationalité</Label>
                  <Input
                    value={formData.nationality}
                    onChange={(e) => handleChange('nationality', e.target.value)}
                    placeholder="Nationalité"
                    data-testid="nationality-input"
                  />
                </div>
                <div>
                  <Label>Téléphone (10 chiffres) *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="0707070707"
                    required
                    data-testid="phone-input"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="email@exemple.com"
                    data-testid="email-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact d'urgence & Finance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Finance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom contact d&apos;urgence</Label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                  placeholder="Nom et prénom"
                  data-testid="emergency-name-input"
                />
              </div>
              <div>
                <Label>Téléphone contact</Label>
                <Input
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleChange('emergency_contact_phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="0707070707"
                  data-testid="emergency-phone-input"
                />
              </div>
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                <Checkbox
                  id="exonerated"
                  checked={formData.is_exonerated}
                  onCheckedChange={(v) => handleChange('is_exonerated', v)}
                  data-testid="exonerated-checkbox"
                />
                <Label htmlFor="exonerated" className="cursor-pointer font-medium">Étudiant exonéré</Label>
              </div>
              {!formData.is_exonerated && (
                <div>
                  <Label>Montant scolarité (CFA)</Label>
                  <Input
                    type="number"
                    value={formData.tuition_amount}
                    onChange={(e) => handleChange('tuition_amount', parseFloat(e.target.value) || 0)}
                    placeholder="500000"
                    data-testid="tuition-input"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <Button 
            type="submit" 
            className="bg-slate-900 hover:bg-slate-800 px-8"
            disabled={saving}
            data-testid="submit-inscription"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Inscrire l&apos;étudiant
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
