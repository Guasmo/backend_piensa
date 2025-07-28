import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {
    console.log('🎯 UserService initialized');
  }

  async create(createUserDto: CreateUserDto) {
    try {
      console.log('🔄 Creating user with data:', { 
        ...createUserDto, 
        password: '[HIDDEN]' 
      });

      // Validaciones básicas
      if (!createUserDto.username || !createUserDto.email || !createUserDto.password) {
        throw new BadRequestException('Username, email, and password are required');
      }

      if (createUserDto.password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters long');
      }

      // Verificar si el usuario ya existe
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: createUserDto.username.trim() },
            { email: createUserDto.email.trim() }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === createUserDto.username.trim()) {
          throw new ConflictException('Username already exists');
        }
        if (existingUser.email === createUserDto.email.trim()) {
          throw new ConflictException('Email already exists');
        }
      }

      // Encriptar password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

      // Crear usuario
      const userData = {
        username: createUserDto.username.trim(),
        email: createUserDto.email.trim(),
        password: hashedPassword,
        role: createUserDto.role || 'USER',
        isActive: createUserDto.isActive !== undefined ? createUserDto.isActive : true
      };

      console.log('💾 Creating user in database...');
      const user = await this.prisma.user.create({
        data: userData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log('✅ User created successfully:', user);
      return user;

    } catch (error) {
      console.error('❌ Error in create service:', error);
      
      // Si ya es una excepción conocida, re-lanzarla
      if (error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      // Manejar errores específicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          const field = error.meta?.target as string[];
          const fieldName = field?.[0] || 'Field';
          throw new ConflictException(`${fieldName} already exists`);
        }
      }
      
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll() {
    try {
      console.log('🔍 Fetching all users from database...');
      
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`📋 Found ${users.length} users`);
      return users;
      
    } catch (error) {
      console.error('❌ Error in findAll service:', error);
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: number) {
    try {
      console.log('🔍 Finding user with ID:', id);
      
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID');
      }
      
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      console.log('✅ User found:', user);
      return user;

    } catch (error) {
      console.error('❌ Error in findOne service:', error);
      
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to find user with ID ${id}`);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      console.log('🔄 Updating user with ID:', id);
      console.log('📋 Update data:', { 
        ...updateUserDto, 
        password: updateUserDto.password ? '[HIDDEN]' : undefined 
      });

      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Verificar si el usuario existe
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Si se está actualizando username o email, verificar que no existan
      if (updateUserDto.username || updateUserDto.email) {
        const conflicts = await this.prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: id } }, // Excluir el usuario actual
              {
                OR: [
                  ...(updateUserDto.username ? [{ username: updateUserDto.username.trim() }] : []),
                  ...(updateUserDto.email ? [{ email: updateUserDto.email.trim() }] : [])
                ]
              }
            ]
          }
        });

        if (conflicts) {
          if (conflicts.username === updateUserDto.username?.trim()) {
            throw new ConflictException('Username already exists');
          }
          if (conflicts.email === updateUserDto.email?.trim()) {
            throw new ConflictException('Email already exists');
          }
        }
      }

      // Preparar datos para actualizar
      const updateData: any = {};
      
      if (updateUserDto.username) {
        updateData.username = updateUserDto.username.trim();
      }
      
      if (updateUserDto.email) {
        updateData.email = updateUserDto.email.trim();
      }
      
      if (updateUserDto.password) {
        if (updateUserDto.password.length < 6) {
          throw new BadRequestException('Password must be at least 6 characters long');
        }
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateUserDto.password, saltRounds);
      }
      
      if (updateUserDto.role) {
        updateData.role = updateUserDto.role;
      }
      
      if (updateUserDto.isActive !== undefined) {
        updateData.isActive = updateUserDto.isActive;
      }

      // Si no hay datos para actualizar
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      updateData.updatedAt = new Date();

      console.log('💾 Updating user in database...');
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log('✅ User updated successfully:', updatedUser);
      return updatedUser;

    } catch (error) {
      console.error('❌ Error in update service:', error);
      
      if (error instanceof NotFoundException || 
          error instanceof ConflictException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      // Manejar errores específicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.meta?.target as string[];
          const fieldName = field?.[0] || 'Field';
          throw new ConflictException(`${fieldName} already exists`);
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      
      throw new InternalServerErrorException(`Failed to update user with ID ${id}`);
    }
  }

  async remove(id: number) {
    try {
      console.log('🗑️ Deleting user with ID:', id);
      
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID');
      }

      // Verificar si el usuario existe
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      console.log('💾 Deleting user from database...');
      await this.prisma.user.delete({
        where: { id }
      });

      console.log('✅ User deleted successfully');
      return { message: 'User deleted successfully' };

    } catch (error) {
      console.error('❌ Error in remove service:', error);
      
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      // Manejar errores específicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      
      throw new InternalServerErrorException(`Failed to delete user with ID ${id}`);
    }
  }

  // Métodos adicionales útiles

  async findByUsername(username: string) {
    try {
      console.log('🔍 Finding user by username:', username);
      
      if (!username) {
        throw new BadRequestException('Username is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { username: username.trim() },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new NotFoundException(`User with username '${username}' not found`);
      }

      console.log('✅ User found by username:', user);
      return user;

    } catch (error) {
      console.error('❌ Error in findByUsername service:', error);
      
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to find user with username '${username}'`);
    }
  }

  async findByEmail(email: string) {
    try {
      console.log('🔍 Finding user by email:', email);
      
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { email: email.trim() },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new NotFoundException(`User with email '${email}' not found`);
      }

      console.log('✅ User found by email:', user);
      return user;

    } catch (error) {
      console.error('❌ Error in findByEmail service:', error);
      
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to find user with email '${email}'`);
    }
  }

  async toggleUserStatus(id: number, isActive: boolean) {
    try {
      console.log('🔄 Toggling user status for ID:', id, 'to:', isActive);
      
      return await this.update(id, { isActive });

    } catch (error) {
      console.error('❌ Error in toggleUserStatus service:', error);
      throw error; // Re-lanzar el error ya que update() ya maneja las excepciones
    }
  }

  async getUserStats() {
    try {
      console.log('📊 Getting user statistics...');
      
      const [total, active, inactive, byRole] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.user.count({ where: { isActive: false } }),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: {
            role: true
          }
        })
      ]);

      const stats = {
        total,
        active,
        inactive,
        byRole: byRole.reduce((acc, curr) => {
          acc[curr.role] = curr._count.role;
          return acc;
        }, {} as Record<string, number>)
      };

      console.log('✅ User stats retrieved:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Error in getUserStats service:', error);
      throw new InternalServerErrorException('Failed to get user statistics');
    }
  }

  // Método para verificar contraseña (útil para autenticación)
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ Error verifying password:', error);
      return false;
    }
  }

  // Método para obtener usuario con contraseña (para autenticación)
  async findOneWithPassword(id: number) {
    try {
      console.log('🔍 Finding user with password for ID:', id);
      
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID');
      }
      
      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;

    } catch (error) {
      console.error('❌ Error in findOneWithPassword service:', error);
      
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to find user with ID ${id}`);
    }
  }
}