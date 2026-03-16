type Role = "dancer" | "coach" | "studio" | "judge" | "admin";

const ROLE_HIERARCHY: Record<Role, number> = {
  dancer: 1,
  coach: 2,
  studio: 2,
  judge: 3,
  admin: 4,
};

export function hasRole(userRole: string, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole as Role] >= ROLE_HIERARCHY[requiredRole];
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}

export function isJudge(role: string): boolean {
  return role === "judge" || role === "admin";
}

export function isCoach(role: string): boolean {
  return role === "coach" || role === "admin";
}

export function isStudio(role: string): boolean {
  return role === "studio" || role === "admin";
}

export function canCreateWorkshop(role: string): boolean {
  return role === "coach" || role === "admin";
}

export function canCreateTeam(role: string): boolean {
  return role === "coach" || role === "admin";
}

export function canCreateCompetition(role: string): boolean {
  return role === "admin";
}

export function canAssignJudge(role: string): boolean {
  return role === "admin";
}

export function canScoreBattle(role: string): boolean {
  return role === "judge" || role === "admin";
}

export function canManageStudio(role: string, studioOwnerId: string, userId: string): boolean {
  return role === "admin" || studioOwnerId === userId;
}
