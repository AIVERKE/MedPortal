import {
  BadRequestException,
  Controller,
  Post,
  Patch,
  Body,
  UnauthorizedException,
  Req,
  UseGuards,
  Get,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './decorators/public.decorator';
import { RegistroEstudianteDto } from './dto/registro-estudiante.dto';
import { RegistroEstudianteService } from './registro-estudiante.service';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { AccountService } from './account.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { CheckUsernameQueryDto } from './dto/check-username.dto';
import { RegistroDocenteDto } from './dto/registro-docente.dto';
import { RegistroAdministrativoDto } from './dto/registro-administrativo.dto';
import { RegistroConsultorDto } from './dto/registro-consultor.dto';
import { RegistroPersonalService } from './registro-personal.service';
import { CuentaRolService } from './cuenta-rol.service';
import { SwitchRoleDto } from './dto/switch-role.dto';
import {
  CuentaRolAdministrativoDto,
  CuentaRolConsultorDto,
  CuentaRolDocenteDto,
  CuentaRolEstudianteDto,
} from './dto/cuenta-rol.dto';

type UploadedPdf = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname?: string;
};
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accountService: AccountService,
    private readonly registroEstudianteService: RegistroEstudianteService,
    private readonly registroPersonalService: RegistroPersonalService,
    private readonly cuentaRolService: CuentaRolService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user, loginDto.idRol, loginDto.password);
  }

  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @Post('switch-role')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cambiar el rol activo de la sesión autenticada' })
  async switchRole(@Req() req, @Body() dto: SwitchRoleDto) {
    return this.authService.switchRole(req.user.idUsuario, dto.idRol);
  }

  @Post('cuenta/rol/estudiante')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'pdfMatricula', maxCount: 1 },
      { name: 'pdfCarnet', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Registrar datos de estudiante para la cuenta autenticada' })
  async cuentaRolEstudiante(
    @Req() req,
    @Body() dto: CuentaRolEstudianteDto,
    @UploadedFiles()
    files: {
      pdfMatricula?: UploadedPdf[];
      pdfCarnet?: UploadedPdf[];
    },
  ) {
    return this.cuentaRolService.registrarEstudiante(
      req.user.idPersona,
      dto,
      files?.pdfMatricula?.[0],
      files?.pdfCarnet?.[0],
    );
  }

  @Post('cuenta/rol/docente')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Registrar datos de docente para la cuenta autenticada' })
  async cuentaRolDocente(@Req() req, @Body() dto: CuentaRolDocenteDto) {
    return this.cuentaRolService.registrarDocente(req.user.idPersona, dto);
  }

  @Post('cuenta/rol/administrativo')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Registrar datos de administrativo para la cuenta autenticada',
  })
  async cuentaRolAdministrativo(
    @Req() req,
    @Body() dto: CuentaRolAdministrativoDto,
  ) {
    return this.cuentaRolService.registrarAdministrativo(
      req.user.idPersona,
      dto,
    );
  }

  @Post('cuenta/rol/consultor')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'pdfContrato', maxCount: 1 }]),
  )
  @ApiOperation({ summary: 'Registrar datos de consultor para la cuenta autenticada' })
  async cuentaRolConsultor(
    @Req() req,
    @Body() dto: CuentaRolConsultorDto,
    @UploadedFiles()
    files: {
      pdfContrato?: UploadedPdf[];
    },
  ) {
    return this.cuentaRolService.registrarConsultor(
      req.user.idPersona,
      dto,
      files?.pdfContrato?.[0],
    );
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Solicitar enlace de recuperación de contraseña (por CI/usuario)',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.accountService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña con token de un solo uso' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.accountService.resetPassword(dto);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.accountService.changePassword(req.user.idUsuario, dto);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualizar datos personales del usuario autenticado' })
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    if (!req.user?.idPersona) {
      throw new BadRequestException('No hay persona vinculada a la cuenta.');
    }
    return this.accountService.updateProfile(req.user.idPersona, dto);
  }

  @Get('profile/username/check')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Verificar disponibilidad de un nombre de usuario y sugerir alternativas',
  })
  async checkUsername(@Req() req, @Query() query: CheckUsernameQueryDto) {
    return this.accountService.checkUsernameAvailability(
      req.user.idUsuario,
      query.username,
    );
  }

  @Patch('profile/username')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Actualizar nombre de usuario de la cuenta autenticada' })
  async updateUsername(@Req() req, @Body() dto: UpdateUsernameDto) {
    return this.accountService.updateUsername(req.user.idUsuario, dto);
  }

  @Patch('profile/foto')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('foto'))
  @ApiOperation({ summary: 'Actualizar foto de perfil del usuario autenticado' })
  async updateProfilePhoto(
    @Req() req,
    @UploadedFile() file: UploadedPdf,
  ) {
    return this.accountService.updateProfilePhoto(req.user.idPersona, file);
  }

  @Patch('estudiante/documentos')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'pdfMatricula', maxCount: 1 },
      { name: 'pdfCarnet', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Actualizar documentos PDF del estudiante autenticado' })
  async updateEstudianteDocumentos(
    @Req() req,
    @UploadedFiles()
    files: {
      pdfMatricula?: UploadedPdf[];
      pdfCarnet?: UploadedPdf[];
    },
  ) {
    return this.accountService.updateEstudianteDocumentos(
      req.user.idPersona,
      files?.pdfMatricula?.[0],
      files?.pdfCarnet?.[0],
    );
  }

  @Public()
  @Get('login/oidc')
  @ApiOperation({
    summary: 'Iniciar login con OIDC (Keycloak)',
    description:
      'Redirige al servidor de identidad para autenticación externa.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirección al proveedor de identidad.',
  })
  loginOidc() {
    // Este método inicia el flujo de OIDC
  }

  @Public()
  @Get('oidc/callback')
  @UseGuards(AuthGuard('oidc'))
  @ApiOperation({
    summary: 'Callback de OIDC',
    description:
      'Endpoint procesado por el proveedor de identidad. Genera un JWT local tras el éxito.',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa. Retorna el token JWT local.',
  })
  @ApiResponse({ status: 401, description: 'Autenticación fallida.' })
  async loginOidcCallback(@Req() req) {
    // Passport ya validó al usuario y lo puso en req.user
    // Ahora generamos el JWT local y l|o devolvemos
    const tokenData = await this.authService.login(req.user);

    // Aquí puedes redirigir al frontend con el token
    // O simplemente devolver el JSON si el frontend maneja la redirección (menos común en OIDC)
    return tokenData;
  }

  @Public()
  @Get('captcha')
  @ApiOperation({ summary: 'Genera captcha para registro público' })
  getCaptcha() {
    return this.registroEstudianteService.generateCaptcha();
  }

  @Public()
  @Post('registro/estudiante')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'pdfMatricula', maxCount: 1 },
      { name: 'pdfCarnet', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Registro público de estudiante' })
  @ApiResponse({ status: 201, description: 'Registro recibido correctamente.' })
  async registrarEstudiante(
    @Body() registroEstudianteDto: RegistroEstudianteDto,
    @UploadedFiles()
    files: {
      pdfMatricula?: UploadedPdf[];
      pdfCarnet?: UploadedPdf[];
    },
  ) {
    const pdfMatricula = files?.pdfMatricula?.[0];
    const pdfCarnet = files?.pdfCarnet?.[0];

    const MAX_MATRICULA_BYTES = 1 * 1024 * 1024;
    const MAX_CARNET_BYTES = 3 * 1024 * 1024;

    if (pdfMatricula) {
      if (pdfMatricula.mimetype !== 'application/pdf') {
        throw new BadRequestException('Solo se permiten archivos PDF.');
      }
      if (pdfMatricula.size > MAX_MATRICULA_BYTES) {
        throw new BadRequestException(
          'El PDF de matrícula debe pesar máximo 1MB.',
        );
      }
    }

    if (pdfCarnet) {
      if (pdfCarnet.mimetype !== 'application/pdf') {
        throw new BadRequestException('Solo se permiten archivos PDF.');
      }
      if (pdfCarnet.size > MAX_CARNET_BYTES) {
        throw new BadRequestException(
          'El PDF de carnet de identidad debe pesar máximo 3MB.',
        );
      }
    }

    return this.registroEstudianteService.registrarEstudiante(
      registroEstudianteDto,
      pdfMatricula,
      pdfCarnet,
    );
  }

  @Public()
  @Post('registro/docente')
  @UseInterceptors(FileFieldsInterceptor([]))
  @ApiOperation({ summary: 'Registro público de docente' })
  @ApiResponse({ status: 201, description: 'Registro recibido correctamente.' })
  async registrarDocente(@Body() registroDocenteDto: RegistroDocenteDto) {
    return this.registroPersonalService.registrarDocente(registroDocenteDto);
  }

  @Public()
  @Post('registro/administrativo')
  @UseInterceptors(FileFieldsInterceptor([]))
  @ApiOperation({ summary: 'Registro público de administrativo' })
  @ApiResponse({ status: 201, description: 'Registro recibido correctamente.' })
  async registrarAdministrativo(
    @Body() registroAdministrativoDto: RegistroAdministrativoDto,
  ) {
    return this.registroPersonalService.registrarAdministrativo(
      registroAdministrativoDto,
    );
  }

  @Public()
  @Post('registro/consultor')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'pdfContrato', maxCount: 1 }]),
  )
  @ApiOperation({ summary: 'Registro público de consultor' })
  @ApiResponse({ status: 201, description: 'Registro recibido correctamente.' })
  async registrarConsultor(
    @Body() registroConsultorDto: RegistroConsultorDto,
    @UploadedFiles()
    files: {
      pdfContrato?: UploadedPdf[];
    },
  ) {
    return this.registroPersonalService.registrarConsultor(
      registroConsultorDto,
      files?.pdfContrato?.[0],
    );
  }
}
