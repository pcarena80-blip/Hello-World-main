import { useAuth } from '@/contexts/AuthContext';
import { PermissionChecker } from '@/types/rbac';
import { Project, Task } from '@/types/tasks';

export function usePermissions() {
  const { user } = useAuth();

  const checkProjectPermission = (
    project: Project,
    action: 'create' | 'read' | 'update' | 'delete' | 'assignToUser' | 'manageMembers'
  ): boolean => {
    if (!user) return false;

    // Project owner always has all permissions
    if (project.owner?.id === user.id) return true;

    // Check if user is in project team with appropriate role
    const teamMember = project.team?.find(member => member.id === user.id);
    if (teamMember) {
      switch (teamMember.role) {
        case 'owner':
        case 'admin':
          return true;
        case 'member':
          return ['create', 'read', 'update'].includes(action);
        case 'viewer':
          return action === 'read';
        default:
          break;
      }
    }

    // Check RBAC permissions
    if (project.permissions) {
      const permission = project.permissions[action];
      if (permission) {
        return PermissionChecker.hasPermission(
          user.id,
          'projects',
          action,
          permission,
          user.role
        );
      }
    }

    // Default: no permission
    return false;
  };

  const checkTaskPermission = (
    task: Task,
    project: Project,
    action: 'create' | 'read' | 'update' | 'delete' | 'assignToUser' | 'changeStatus'
  ): boolean => {
    if (!user) return false;

    // Task creator always has all permissions
    if (task.createdBy?.id === user.id) return true;

    // Check project permissions first
    if (action === 'create') {
      return checkProjectPermission(project, 'create');
    }

    // For other actions, check if user can read the project
    if (!checkProjectPermission(project, 'read')) {
      return false;
    }

    // Check specific task permissions
    switch (action) {
      case 'read':
        return true; // If they can read project, they can read tasks
      case 'update':
      case 'changeStatus':
        return checkProjectPermission(project, 'update');
      case 'delete':
        return checkProjectPermission(project, 'delete');
      case 'assignToUser':
        return checkProjectPermission(project, 'assignToUser');
      default:
        return false;
    }
  };

  const canCreateProject = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin', 'manager'].includes(user.role || '');
  };

  const canManageOrganization = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'admin'].includes(user.role || '');
  };

  const canDeleteProject = (project: Project): boolean => {
    if (!user) return false;
    
    // Project owner can always delete
    if (project.owner?.id === user.id) return true;
    
    // Super admin can delete any project
    if (user.role === 'super_admin') return true;
    
    // Check RBAC permissions
    return checkProjectPermission(project, 'delete');
  };

  const canEditProject = (project: Project): boolean => {
    if (!user) return false;
    
    // Project owner can always edit
    if (project.owner?.id === user.id) return true;
    
    // Check team role
    const teamMember = project.team?.find(member => member.id === user.id);
    if (teamMember && ['owner', 'admin'].includes(teamMember.role)) {
      return true;
    }
    
    // Check RBAC permissions
    return checkProjectPermission(project, 'update');
  };

  const canViewProject = (project: Project): boolean => {
    if (!user) return false;
    
    // Project owner can always view
    if (project.owner?.id === user.id) return true;
    
    // Check if user is in project team
    const teamMember = project.team?.find(member => member.id === user.id);
    if (teamMember) return true;
    
    // Check RBAC permissions
    return checkProjectPermission(project, 'read');
  };

  return {
    checkProjectPermission,
    checkTaskPermission,
    canCreateProject,
    canManageOrganization,
    canDeleteProject,
    canEditProject,
    canViewProject,
    user
  };
}
