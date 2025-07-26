import { SetMetadata } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Auth } from "./auth.decorator";

export const META_ROLES = "roles";

export const RoleProtected = (...args: string[]) => {
	return SetMetadata(META_ROLES, args);
};

export const AllRoles = () =>
	Auth(
		Role.ADMIN,
		Role.USER,
        Role.SUPERADMIN
	);

export const AdminAuth = () => Auth(Role.ADMIN, Role.SUPERADMIN);
