export type Role = 'patient' | 'admin' | 'specialist' | 'doctor';	

export enum TRole {
  patient = 'patient',
  admin = 'admin',
  specialist = 'specialist',
  doctor = 'doctor',
  common = 'common' // its not a role but a common access level
}

const allRoles: Record<Role, string[]> = {
  patient: ['patient', 'common'], 
  admin: ['admin', 'common'],
  specialist: ['specialist', 'common'],
  doctor: ['doctor', 'common'],
};

const Roles = Object.keys(allRoles) as Array<keyof typeof allRoles>;

// Map the roles to their corresponding rights
const roleRights = new Map<Role, string[]>(
  Object.entries(allRoles) as [Role, string[]][],
);

export { Roles, roleRights };
