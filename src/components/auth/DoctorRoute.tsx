import { Navigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { UserRole } from '../../types';

/** Guards /doctor/* routes: must be logged in AND have the Doctor role.
    Admins may also enter to supervise; everyone else lands on home. */
export default function DoctorRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== UserRole.Doctor && user.role !== UserRole.Admin)
    return <Navigate to="/" replace />;
  return <>{children}</>;
}
