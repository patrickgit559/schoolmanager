import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Students
import StudentInscription from "./pages/students/Inscription";
import StudentList from "./pages/students/StudentList";
import StudentReinscription from "./pages/students/Reinscription";
import StudentCards from "./pages/students/StudentCards";

// Creation
import CampusManagement from "./pages/creation/CampusManagement";
import AcademicYearManagement from "./pages/creation/AcademicYearManagement";
import FormationManagement from "./pages/creation/FormationManagement";
import FiliereManagement from "./pages/creation/FiliereManagement";
import LevelManagement from "./pages/creation/LevelManagement";
import ClassManagement from "./pages/creation/ClassManagement";
import SubjectManagement from "./pages/creation/SubjectManagement";

// Professors
import ProfessorList from "./pages/professors/ProfessorList";
import ProfessorHours from "./pages/professors/ProfessorHours";

// Staff
import StaffList from "./pages/staff/StaffList";
import StaffCards from "./pages/staff/StaffCards";

// Grades
import GradeEntry from "./pages/grades/GradeEntry";
import Bulletins from "./pages/grades/Bulletins";
import GradeList from "./pages/grades/GradeList";

// Documents
import { CertificateFrequentation, CertificateScolarite, CertificateAdmission, AttestationAuthentification } from "./pages/documents/DocumentGenerator";

// Diplomas
import Diplomas from "./pages/Diplomas";

// Finance
import FinanceJournal from "./pages/finance/FinanceJournal";
import PaymentManagement from "./pages/finance/PaymentManagement";
import ExpenseManagement from "./pages/finance/ExpenseManagement";
import FinanceBalance from "./pages/finance/FinanceBalance";

// Other
import UserManagement from "./pages/UserManagement";
import Archives from "./pages/Archives";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
};

// Public Route wrapper (redirects to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Students */}
      <Route path="/students/inscription" element={<ProtectedRoute><StudentInscription /></ProtectedRoute>} />
      <Route path="/students/reinscription" element={<ProtectedRoute><StudentReinscription /></ProtectedRoute>} />
      <Route path="/students/list" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
      <Route path="/students/cards" element={<ProtectedRoute><StudentCards /></ProtectedRoute>} />
      
      {/* Creation */}
      <Route path="/creation/campus" element={<ProtectedRoute><CampusManagement /></ProtectedRoute>} />
      <Route path="/creation/academic-years" element={<ProtectedRoute><AcademicYearManagement /></ProtectedRoute>} />
      <Route path="/creation/formations" element={<ProtectedRoute><FormationManagement /></ProtectedRoute>} />
      <Route path="/creation/filieres" element={<ProtectedRoute><FiliereManagement /></ProtectedRoute>} />
      <Route path="/creation/levels" element={<ProtectedRoute><LevelManagement /></ProtectedRoute>} />
      <Route path="/creation/classes" element={<ProtectedRoute><ClassManagement /></ProtectedRoute>} />
      <Route path="/creation/subjects" element={<ProtectedRoute><SubjectManagement /></ProtectedRoute>} />
      
      {/* Professors */}
      <Route path="/professors/list" element={<ProtectedRoute><ProfessorList /></ProtectedRoute>} />
      <Route path="/professors/hours" element={<ProtectedRoute><ProfessorHours /></ProtectedRoute>} />
      
      {/* Staff */}
      <Route path="/staff/list" element={<ProtectedRoute><StaffList /></ProtectedRoute>} />
      <Route path="/staff/cards" element={<ProtectedRoute><StaffCards /></ProtectedRoute>} />
      
      {/* Grades */}
      <Route path="/grades/entry" element={<ProtectedRoute><GradeEntry /></ProtectedRoute>} />
      <Route path="/grades/bulletins" element={<ProtectedRoute><Bulletins /></ProtectedRoute>} />
      <Route path="/grades/list" element={<ProtectedRoute><GradeList /></ProtectedRoute>} />
      
      {/* Documents */}
      <Route path="/documents/frequentation" element={<ProtectedRoute><CertificateFrequentation /></ProtectedRoute>} />
      <Route path="/documents/scolarite" element={<ProtectedRoute><CertificateScolarite /></ProtectedRoute>} />
      <Route path="/documents/admission" element={<ProtectedRoute><CertificateAdmission /></ProtectedRoute>} />
      <Route path="/documents/authentification" element={<ProtectedRoute><AttestationAuthentification /></ProtectedRoute>} />
      
      {/* Diplomas */}
      <Route path="/diplomas" element={<ProtectedRoute><Diplomas /></ProtectedRoute>} />
      
      {/* Finance */}
      <Route path="/finance/journal" element={<ProtectedRoute><FinanceJournal /></ProtectedRoute>} />
      <Route path="/finance/payments" element={<ProtectedRoute><PaymentManagement /></ProtectedRoute>} />
      <Route path="/finance/expenses" element={<ProtectedRoute><ExpenseManagement /></ProtectedRoute>} />
      <Route path="/finance/balance" element={<ProtectedRoute><FinanceBalance /></ProtectedRoute>} />
      
      {/* Archives */}
      <Route path="/archives" element={<ProtectedRoute><Archives /></ProtectedRoute>} />
      
      {/* Users */}
      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
