export type Role = 'provider' | 'user' | 'admin' | 'subAdmin';	

export enum TRole {
  provider = 'provider',
  user = 'user',
  admin = 'admin',
  subAdmin = 'subAdmin',
  common = 'common', // its not a role but a common access level
  commonUser = 'commonUser', // its not a role but a common access level
  commonAdmin = 'commonAdmin'
}

const allRoles: Record<Role, string[]> = {
  provider: ['provider', 'common', 'commonUser' ], 
  user: ['user', 'common' , 'commonUser'],
  admin: ['admin', 'common', 'commonAdmin'],
  subAdmin: ['subAdmin', 'common', 'commonAdmin'],
};

// const Roles = Object.keys(allRoles) as Array<keyof typeof allRoles>;

const Roles = ["provider", "user", "admin", "subAdmin"] as const;

// Map the roles to their corresponding rights
const roleRights = new Map<Role, string[]>(
  Object.entries(allRoles) as [Role, string[]][],
);

export { Roles, roleRights };
