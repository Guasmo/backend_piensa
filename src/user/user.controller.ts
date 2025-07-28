import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  HttpException
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { Role } from '@prisma/client';

@ApiTags('users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {
    console.log('🎯 UserController initialized');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Conflict - username or email already exists' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createUserDto: CreateUserDto) {
    console.log('📝 POST /user endpoint called');
    console.log('📋 Request body:', { 
      ...createUserDto, 
      password: '[HIDDEN]' 
    });

    try {
      const result = await this.userService.create(createUserDto);
      console.log('✅ User created successfully in controller');
      return result;
    } catch (error) {
      console.error('❌ Error in create endpoint:', error.message);
      
      // Re-lanzar la excepción para que NestJS la maneje correctamente
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Si no es una HttpException, crear una genérica
      throw new HttpException(
        error.message || 'Failed to create user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll() {
    console.log('📋 GET /user endpoint called');
    
    try {
      const users = await this.userService.findAll();
      console.log(`✅ Retrieved ${users.length} users in controller`);
      return users;
    } catch (error) {
      console.error('❌ Error in findAll endpoint:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to fetch users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    console.log('🔍 GET /user/:id endpoint called with ID:', id);
    
    try {
      const user = await this.userService.findOne(id);
      console.log('✅ User found in controller');
      return user;
    } catch (error) {
      console.error('❌ Error in findOne endpoint:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to find user with ID ${id}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Conflict - username or email already exists' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    console.log('🔄 PATCH /user/:id endpoint called with ID:', id);
    console.log('📋 Request body:', { 
      ...updateUserDto, 
      password: updateUserDto.password ? '[HIDDEN]' : undefined 
    });

    try {
      const result = await this.userService.update(id, updateUserDto);
      console.log('✅ User updated successfully in controller');
      return result;
    } catch (error) {
      console.error('❌ Error in update endpoint:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to update user with ID ${id}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    console.log('🗑️ DELETE /user/:id endpoint called with ID:', id);
    
    try {
      await this.userService.remove(id);
      console.log('✅ User deleted successfully in controller');
      // Para DELETE, no retornamos contenido (204 No Content)
      return;
    } catch (error) {
      console.error('❌ Error in remove endpoint:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to delete user with ID ${id}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}