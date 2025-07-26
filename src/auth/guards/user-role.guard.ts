import {
	BadRequestException,
	CanActivate,
	ExecutionContext,
	Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { META_ROLES } from "../decorators/role-protected.decorator";

@Injectable()
export class UserRoleGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest();
		const user = req.user;
		if (!user) throw new BadRequestException("User not found");

		const roles = this.reflector.get<string[]>(
			META_ROLES,
			context.getHandler(),
		);
		if (!roles) return true;

		return true;
	}

	async getRoles(context: ExecutionContext): Promise<string[]> {
		return this.reflector.get<string[]>(META_ROLES, context.getHandler());
	}
}
