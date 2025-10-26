import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificar estado del servidor' })
  @ApiResponse({ status: 200, description: 'Servidor funcionando correctamente' })
  getHealth() {
    return {
      status: 'OK',
      message: 'SukaBack está funcionando correctamente',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Verificar estado de la base de datos' })
  @ApiResponse({ status: 200, description: 'Base de datos conectada' })
  @ApiResponse({ status: 503, description: 'Base de datos no disponible' })
  async getDatabaseHealth() {
    try {
      // Verificar la conexión ejecutando una consulta simple
      await this.connection.query('SELECT 1');
      
      return {
        status: 'OK',
        message: 'Base de datos conectada exitosamente',
        database: 'PostgreSQL AWS RDS',
        host: process.env.DB_HOST,
        database_name: process.env.DB_NAME,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'ERROR',
        message: 'Error de conexión a la base de datos',
        database: 'PostgreSQL AWS RDS',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString(),
      };
    }
  }
}