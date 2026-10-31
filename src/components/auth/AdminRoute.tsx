import { Navigate } from 'react-router-dom';
import { authService } from '../../services/api/authService';
import { UserRole } from '../../types';

/** Guards /admin/* routes: must be logged in AND have the Admin role.
    Non-admins land back on home; anonymous visitors go to login. */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== UserRole.Admin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
