export class RegisterDto {
    id: number;
    username: string;
    email: string;
    password: string;
    is_active?: boolean;
}