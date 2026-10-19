import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Formulario,
  FormularioDefinicion,
} from '../modules/forms/entities/formulario.entity';
import { FormularioInstancia } from '../modules/forms/entities/formulario-instancia.entity';
import { FormularioInstanciaVersion } from '../modules/forms/entities/formulario-instancia-version.entity';
import { FormularioPermisoRol } from '../modules/forms/entities/formulario-permiso-rol.entity';
import { Rol } from '../modules/users/entities/rol.entity';
import { Usuario } from '../modules/users/entities/usuario.entity';
import {
  CreateFormularioInstanciaDto,
  UpdateFormularioDto,
  UpdateFormularioInstanciaDto,
} from './dto/update-formulario.dto';

const EMPTY_DEFINITION: FormularioDefinicion = { sections: [] };

const DEFAULT_FULL_PERM_ROLES = ['SUPERUSUARIO', 'DIRECTOR'];

const PATIENT_ROLES = [
  'ESTUDIANTE',
  'DOCENTE',
  'ADMINISTRATIVO',
  'CONSULTOR',
];

const CAN_FILL_FOR_PATIENT_ROLES = ['DOCTOR', 'SUPERUSUARIO'];

const CATEGORIAS = ['historial', 'encuesta', 'operativo'] as const;

type AuthUser = {
  idUsuario: number;
  idPersona?: number;
  rol?: string;
  rolId?: number;
};

@Injectable()
export class FormulariosService {
  constructor(
    @InjectRepository(Formulario)
    private readonly formulariosRepository: Repository<Formulario>,
    @InjectRepository(FormularioPermisoRol)
    private readonly permisosRepository: Repository<FormularioPermisoRol>,
    @InjectRepository(FormularioInstancia)
    private readonly instanciasRepository: Repository<FormularioInstancia>,
    @InjectRepository(FormularioInstanciaVersion)
    private readonly versionesRepository: Repository<FormularioInstanciaVersion>,
    @InjectRepository(Rol)
    private readonly rolesRepository: Repository<Rol>,
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  async create(
    creadoPorIdPersona?: number | null,
    actorIdUsuario?: number | null,
  ) {
    const formulario = this.formulariosRepository.create({
      titulo: 'Formulario sin título',
      descripcion: null,
      categoria: null,
      estado: 'borrador',
      fillMode: 'single',
      fillLimit: 1,
      visibilidadInstancias: 'publico',
      definicionBorrador: EMPTY_DEFINITION,
      definicionPublicada: null,
      publicadoEn: null,
      guardadoEn: new Date(),
      creadoPorIdPersona: creadoPorIdPersona ?? null,
      ultimoGuardadoPorIdUsuario: actorIdUsuario ?? null,
      permisos: [],
    });

    const saved = await this.formulariosRepository.save(formulario);
    await this.seedDefaultPermisos(saved.idFormulario);
    return this.toDetailResponse(await this.findEntity(saved.idFormulario));
  }

  async findAll(filters: { categoria?: string; search?: string } = {}) {
    const qb = this.formulariosRepository
      .createQueryBuilder('f')
      .where('f.deleted_at IS NULL')
      .orderBy('f.updated_at', 'DESC');

    if (filters.categoria && filters.categoria !== 'todos') {
      qb.andWhere('f.categoria = :categoria', { categoria: filters.categoria });
    }

    if (filters.search?.trim()) {
      qb.andWhere(
        '(LOWER(f.titulo) LIKE :search OR LOWER(COALESCE(f.descripcion, \'\')) LIKE :search)',
        { search: `%${filters.search.trim().toLowerCase()}%` },
      );
    }

    const rows = await qb.getMany();
    return rows.map((row) => this.toListItem(row));
  }

  async findOne(id: number) {
    return this.toDetailResponse(await this.findEntity(id));
  }

  async update(
    id: number,
    dto: UpdateFormularioDto,
    actorIdUsuario?: number | null,
  ) {
    const formulario = await this.findEntity(id);

    if (dto.titulo !== undefined) {
      const titulo = dto.titulo.trim();
      formulario.titulo = titulo || 'Formulario sin título';
    }
    if (dto.descripcion !== undefined) {
      formulario.descripcion = dto.descripcion;
    }
    if (dto.categoria !== undefined) {
      formulario.categoria = dto.categoria;
    }
    if (dto.fillMode !== undefined) {
      formulario.fillMode = dto.fillMode;
      if (dto.fillMode === 'single') {
        formulario.fillLimit = 1;
      } else if (dto.fillMode === 'unlimited') {
        formulario.fillLimit = null;
      }
    }
    if (dto.fillLimit !== undefined && formulario.fillMode === 'limited') {
      formulario.fillLimit = dto.fillLimit ?? 1;
    }
    if (dto.visibilidadInstancias !== undefined) {
      formulario.visibilidadInstancias = dto.visibilidadInstancias;
    }
    if (dto.definicionBorrador !== undefined) {
      this.assertDefinicionShape(dto.definicionBorrador);
      formulario.definicionBorrador =
        dto.definicionBorrador as FormularioDefinicion;
    }

    formulario.guardadoEn = new Date();
    if (actorIdUsuario) {
      formulario.ultimoGuardadoPorIdUsuario = actorIdUsuario;
    }
    await this.formulariosRepository.save(formulario);

    if (dto.permisos !== undefined) {
      await this.replacePermisos(id, dto.permisos);
    }

    return this.toDetailResponse(await this.findEntity(id));
  }

  async publish(id: number, actorIdUsuario?: number | null) {
    const formulario = await this.findEntity(id);

    if (!formulario.categoria) {
      throw new BadRequestException(
        'Debes elegir el tipo de formulario antes de publicar.',
      );
    }

    const sections = formulario.definicionBorrador?.sections ?? [];
    const hasField = sections.some(
      (section) => Array.isArray(section.fields) && section.fields.length > 0,
    );
    if (!sections.length || !hasField) {
      throw new BadRequestException(
        'El formulario necesita al menos una sección con un campo para publicarse.',
      );
    }

    formulario.definicionPublicada = JSON.parse(
      JSON.stringify(formulario.definicionBorrador),
    );
    formulario.estado = 'publicado';
    formulario.publicadoEn = new Date();
    formulario.guardadoEn = new Date();
    if (actorIdUsuario) {
      formulario.ultimoPublicadoPorIdUsuario = actorIdUsuario;
      formulario.ultimoGuardadoPorIdUsuario = actorIdUsuario;
    }

    await this.formulariosRepository.save(formulario);
    return this.toDetailResponse(await this.findEntity(id));
  }

  async revertToPublished(id: number, actorIdUsuario?: number | null) {
    const formulario = await this.findEntity(id);

    if (!formulario.definicionPublicada) {
      throw new BadRequestException(
        'Este formulario aún no tiene una versión publicada a la que revertir.',
      );
    }

    formulario.definicionBorrador = JSON.parse(
      JSON.stringify(formulario.definicionPublicada),
    );
    formulario.guardadoEn = new Date();
    if (actorIdUsuario) {
      formulario.ultimoGuardadoPorIdUsuario = actorIdUsuario;
    }

    await this.formulariosRepository.save(formulario);
    return this.toDetailResponse(await this.findEntity(id));
  }

  async remove(id: number) {
    await this.findEntity(id);
    await this.formulariosRepository.softDelete({ idFormulario: id });
    return { deleted: true, idFormulario: id };
  }

  async preview(id: number, version: 'draft' | 'published' = 'draft') {
    const formulario = await this.findEntity(id);

    if (version === 'published') {
      if (!formulario.definicionPublicada) {
        throw new NotFoundException(
          'Este formulario aún no tiene una versión publicada.',
        );
      }
      return {
        idFormulario: formulario.idFormulario,
        titulo: formulario.titulo,
        descripcion: formulario.descripcion,
        categoria: formulario.categoria,
        version: 'published' as const,
        publicadoEn: formulario.publicadoEn,
        definicion: formulario.definicionPublicada,
      };
    }

    return {
      idFormulario: formulario.idFormulario,
      titulo: formulario.titulo,
      descripcion: formulario.descripcion,
      categoria: formulario.categoria,
      version: 'draft' as const,
      guardadoEn: formulario.guardadoEn,
      definicion: formulario.definicionBorrador,
    };
  }

  async sidebarAccess(user: AuthUser) {
    const canViewPublished = await this.countFormsWithPermission(
      user,
      'canView',
      true,
    );
    const canFillPublished = await this.countFormsWithPermission(
      user,
      'canFill',
      true,
    );
    const canViewAny = await this.countFormsWithPermission(user, 'canView', false);
    const isStaff = this.isStaffRole(user.rol);

    return {
      showLlenarFormularios: canViewPublished > 0 || canFillPublished > 0,
      showFormulariosPacientes: isStaff && canViewAny > 0,
      canViewCount: canViewPublished,
      canFillCount: canFillPublished,
    };
  }

  async findParaLlenar(
    user: AuthUser,
    filters: { categoria?: string; search?: string } = {},
  ) {
    const permiso = await this.requireRolId(user);
    const qb = this.formulariosRepository
      .createQueryBuilder('f')
      .innerJoin(
        'f.permisos',
        'p',
        'p.idRol = :rolId AND (p.canView = true OR p.canFill = true)',
        { rolId: permiso },
      )
      .where('f.deletedAt IS NULL')
      .andWhere('f.estado = :estado', { estado: 'publicado' })
      .andWhere('f.definicionPublicada IS NOT NULL')
      .orderBy('f.titulo', 'ASC');

    if (filters.categoria && filters.categoria !== 'todos') {
      qb.andWhere('f.categoria = :categoria', { categoria: filters.categoria });
    }

    if (filters.search?.trim()) {
      qb.andWhere(
        '(LOWER(f.titulo) LIKE :search OR LOWER(COALESCE(f.descripcion, \'\')) LIKE :search)',
        { search: `%${filters.search.trim().toLowerCase()}%` },
      );
    }

    const rows = await qb.getMany();
    const permisosMap = await this.getPermisosMapForRol(
      rows.map((r) => r.idFormulario),
      permiso,
    );

    return rows.map((row) => {
      const perm = permisosMap.get(row.idFormulario);
      return {
        ...this.toFillListItem(row),
        canView: Boolean(perm?.canView),
        canFill: Boolean(perm?.canFill),
        canEdit: Boolean(perm?.canEdit),
        canDelete: Boolean(perm?.canDelete),
      };
    });
  }

  async getFormularioParaLlenar(id: number, user: AuthUser) {
    const formulario = await this.findEntity(id);
    if (formulario.estado !== 'publicado' || !formulario.definicionPublicada) {
      throw new NotFoundException(
        'Este formulario no está publicado o no tiene versión publicada.',
      );
    }

    const perm = this.getPermisoForUser(formulario, user);
    if (!perm?.canView && !perm?.canFill) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este formulario.',
      );
    }

    return {
      ...this.toFillListItem(formulario),
      definicionPublicada: formulario.definicionPublicada,
      sections: formulario.definicionPublicada.sections ?? [],
      canView: Boolean(perm?.canView),
      canFill: Boolean(perm?.canFill),
      canEdit: Boolean(perm?.canEdit),
      canDelete: Boolean(perm?.canDelete),
      canFillForPatient: this.canFillForPatient(user.rol),
    };
  }

  async createInstancia(
    idFormulario: number,
    dto: CreateFormularioInstanciaDto,
    user: AuthUser,
  ) {
    const formulario = await this.findEntity(idFormulario);
    if (formulario.estado !== 'publicado' || !formulario.definicionPublicada) {
      throw new BadRequestException(
        'Solo se pueden llenar formularios publicados.',
      );
    }

    const perm = this.getPermisoForUser(formulario, user);
    if (!perm?.canFill) {
      throw new ForbiddenException(
        'No tienes permiso para llenar este formulario.',
      );
    }

    const paraQuienId = await this.resolveParaQuien(dto.paraQuienIdUsuario, user);
    const estado = this.normalizeInstanciaEstado(dto.estado ?? 'enviado');

    if (estado === 'enviado') {
      await this.assertFillLimit(formulario, paraQuienId);
      await this.assertNoDraftBlockingCupo(formulario, paraQuienId, user.idUsuario);
    } else if (estado === 'guardado') {
      await this.assertNoDraftBlockingCupo(formulario, paraQuienId, user.idUsuario);
    }

    // Reutilizar borrador propio existente para el mismo destinatario
    if (estado === 'guardado') {
      const existingDraft = await this.instanciasRepository.findOne({
        where: {
          idFormulario,
          quienLlenoIdUsuario: user.idUsuario,
          paraQuienIdUsuario: paraQuienId,
          estado: 'guardado',
        },
      });
      if (existingDraft) {
        existingDraft.respuestas = dto.respuestas ?? {};
        await this.instanciasRepository.save(existingDraft);
        return this.toInstanciaResponse(
          await this.findInstanciaEntity(existingDraft.idInstancia),
          user,
        );
      }
    }

    const instancia = this.instanciasRepository.create({
      idFormulario,
      quienLlenoIdUsuario: user.idUsuario,
      paraQuienIdUsuario: paraQuienId,
      respuestas: dto.respuestas ?? {},
      definicionSnapshot: JSON.parse(
        JSON.stringify(formulario.definicionPublicada),
      ),
      estado,
    });

    const saved = await this.instanciasRepository.save(instancia);
    if (estado === 'enviado') {
      await this.createVersionSnapshot(saved, user.idUsuario);
    }
    return this.toInstanciaResponse(
      await this.findInstanciaEntity(saved.idInstancia),
      user,
    );
  }

  async getContextoLlenado(
    idFormulario: number,
    user: AuthUser,
    paraQuienIdUsuario?: number,
  ) {
    const formulario = await this.findEntity(idFormulario);
    if (formulario.estado !== 'publicado' || !formulario.definicionPublicada) {
      throw new NotFoundException(
        'Este formulario no está publicado o no tiene versión publicada.',
      );
    }

    const perm = this.getPermisoForUser(formulario, user);
    if (!perm?.canView && !perm?.canFill) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a este formulario.',
      );
    }

    const paraQuienId = await this.resolveParaQuien(paraQuienIdUsuario, user);

    const drafts = await this.instanciasRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.formulario', 'f')
      .leftJoinAndSelect('f.permisos', 'p')
      .leftJoinAndSelect('p.rol', 'rol')
      .leftJoinAndSelect('i.quienLleno', 'quien')
      .leftJoinAndSelect('quien.persona', 'quienPersona')
      .leftJoinAndSelect('i.paraQuien', 'para')
      .leftJoinAndSelect('para.persona', 'paraPersona')
      .where('i.idFormulario = :idFormulario', { idFormulario })
      .andWhere('i.quienLlenoIdUsuario = :quien', { quien: user.idUsuario })
      .andWhere('i.paraQuienIdUsuario = :para', { para: paraQuienId })
      .andWhere('i.estado IN (:...estados)', { estados: ['guardado', 'borrador'] })
      .orderBy('i.updatedAt', 'DESC')
      .getOne();
    const miBorrador = drafts ?? null;

    const enviados = await this.instanciasRepository.find({
      where: {
        idFormulario,
        paraQuienIdUsuario: paraQuienId,
        estado: 'enviado',
      },
      relations: [
        'formulario',
        'formulario.permisos',
        'formulario.permisos.rol',
        'quienLleno',
        'quienLleno.persona',
        'paraQuien',
        'paraQuien.persona',
      ],
      order: { updatedAt: 'DESC' },
    });

    const enviadosVisibles: any[] = [];
    for (const inst of enviados) {
      if (this.puedeVerInstancia(user, inst, perm, formulario)) {
        enviadosVisibles.push(await this.toInstanciaResponse(inst, user));
      }
    }

    const atLimit = this.isAtFillLimit(formulario, enviados.length);

    const otrosBorradores = await this.instanciasRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.quienLleno', 'quien')
      .leftJoinAndSelect('quien.persona', 'persona')
      .where('i.idFormulario = :idFormulario', { idFormulario })
      .andWhere('i.paraQuienIdUsuario = :paraQuienId', { paraQuienId })
      .andWhere('i.estado IN (:...estados)', {
        estados: ['guardado', 'borrador'],
      })
      .andWhere('i.quienLlenoIdUsuario != :uid', { uid: user.idUsuario })
      .getMany();

    const occupied = enviados.length + otrosBorradores.length;
    const blockedByDraft = this.isAtFillLimit(formulario, occupied);
    const llenandoPor =
      blockedByDraft && otrosBorradores[0]
        ? this.toUsuarioResumen(otrosBorradores[0].quienLleno)
        : null;

    return {
      paraQuienIdUsuario: paraQuienId,
      fillMode: formulario.fillMode,
      fillLimit: formulario.fillLimit,
      enviadosCount: enviados.length,
      atLimit: atLimit || blockedByDraft,
      llenandoPor,
      canView: Boolean(perm?.canView),
      canFill: Boolean(perm?.canFill) && !blockedByDraft,
      miBorrador: miBorrador
        ? await this.toInstanciaResponse(miBorrador, user)
        : null,
      enviados: enviadosVisibles,
      enviadoResumen:
        formulario.fillMode === 'single' && enviados[0]
          ? {
              idInstancia: enviados[0].idInstancia,
              updatedAt: enviados[0].updatedAt,
              createdAt: enviados[0].createdAt,
              quienLleno: this.toUsuarioResumen(enviados[0].quienLleno),
              canView: this.puedeVerInstancia(
                user,
                enviados[0],
                perm,
                formulario,
              ),
            }
          : null,
    };
  }

  async findMisInstancias(user: AuthUser) {
    const rolId = await this.requireRolId(user);
    const instancias = await this.instanciasRepository.find({
      where: [
        { paraQuienIdUsuario: user.idUsuario },
        { quienLlenoIdUsuario: user.idUsuario },
      ],
      relations: [
        'formulario',
        'formulario.permisos',
        'formulario.permisos.rol',
        'quienLleno',
        'quienLleno.persona',
        'paraQuien',
        'paraQuien.persona',
      ],
      order: { updatedAt: 'DESC' },
    });

    return Promise.all(
      instancias
        .filter((inst) => {
          if (!inst.formulario || inst.formulario.deletedAt) return false;
          const perm = inst.formulario.permisos?.find((p) => p.idRol === rolId);
          return this.puedeVerInstancia(user, inst, perm, inst.formulario);
        })
        .map((inst) => this.toInstanciaResponse(inst, user)),
    );
  }

  async findInstancia(id: number, user: AuthUser, versionId?: number) {
    const instancia = await this.findInstanciaEntity(id, {
      withDeleted: true,
      includeEditDraft: true,
    });
    const perm = this.getPermisoForUser(instancia.formulario, user);
    const isDeleted = Boolean(instancia.deletedAt);

    if (isDeleted && !perm?.canDelete) {
      throw new ForbiddenException('No puedes ver esta instancia eliminada.');
    }
    if (!isDeleted && !this.puedeVerInstancia(user, instancia, perm, instancia.formulario)) {
      throw new ForbiddenException('No puedes ver esta instancia.');
    }

    const response = await this.toInstanciaResponse(instancia, user, {
      includeVersiones: true,
    });

    if (versionId) {
      const version = await this.versionesRepository.findOne({
        where: { idVersion: versionId, idInstancia: id },
        relations: ['editadoPor', 'editadoPor.persona'],
      });
      if (!version) {
        throw new NotFoundException('Versión no encontrada.');
      }
      response.versionSeleccionada = {
        idVersion: version.idVersion,
        createdAt: version.createdAt,
        editadoPor: this.toUsuarioResumen(version.editadoPor),
        respuestas: version.respuestas ?? {},
        definicionSnapshot: version.definicionSnapshot,
        sections: this.buildSectionsForView(
          version.definicionSnapshot,
          instancia.formulario.definicionPublicada,
          version.respuestas ?? {},
        ),
        isCurrent:
          response.editores?.[response.editores.length - 1]?.idVersion ===
          version.idVersion,
      };
      response.respuestas = version.respuestas ?? {};
      response.sections = response.versionSeleccionada.sections;
      response.definicionSnapshot = version.definicionSnapshot;
    }

    return response;
  }

  async updateInstancia(
    id: number,
    dto: UpdateFormularioInstanciaDto,
    user: AuthUser,
  ) {
    const instancia = await this.findInstanciaEntity(id);
    const perm = this.getPermisoForUser(instancia.formulario, user);
    const isOwner = instancia.quienLlenoIdUsuario === user.idUsuario;
    const isDraft = this.isDraftEstado(instancia.estado);
    const nextEstado = dto.estado
      ? this.normalizeInstanciaEstado(dto.estado)
      : instancia.estado;
    const becomingEnviado = isDraft && nextEstado === 'enviado';

    if (isDraft) {
      if (!isOwner) {
        throw new ForbiddenException(
          'Solo quien está llenando este borrador puede modificarlo.',
        );
      }
    } else {
      if (!this.puedeVerInstancia(user, instancia, perm, instancia.formulario)) {
        throw new ForbiddenException('No puedes editar esta instancia.');
      }
      if (!perm?.canEdit) {
        throw new ForbiddenException(
          'No tienes permiso para editar instancias de este formulario.',
        );
      }
      if (
        instancia.formulario.visibilidadInstancias === 'privado' &&
        !isOwner
      ) {
        throw new ForbiddenException(
          'Solo quien llenó esta instancia privada puede editarla.',
        );
      }
    }

    if (becomingEnviado || (nextEstado === 'enviado' && dto.estado)) {
      if (!perm?.canFill && !isOwner) {
        throw new ForbiddenException(
          'No tienes permiso para enviar este formulario.',
        );
      }
      await this.assertFillLimit(
        instancia.formulario,
        instancia.paraQuienIdUsuario,
        instancia.idInstancia,
      );
    }

    if (dto.respuestas !== undefined) {
      instancia.respuestas = dto.respuestas;
    }
    if (dto.estado !== undefined) {
      instancia.estado = nextEstado;
    }

    await this.instanciasRepository.save(instancia);
    if (becomingEnviado) {
      await this.createVersionSnapshot(instancia, user.idUsuario);
    }
    return this.toInstanciaResponse(
      await this.findInstanciaEntity(id),
      user,
    );
  }

  async startOrSaveEditDraft(
    id: number,
    user: AuthUser,
    respuestas?: Record<string, unknown>,
  ) {
    const instancia = await this.findInstanciaEntity(id, {
      includeEditDraft: true,
    });
    if (instancia.deletedAt) {
      throw new BadRequestException(
        'No se puede editar una instancia eliminada. Recupérala primero.',
      );
    }
    if (instancia.estado !== 'enviado') {
      throw new BadRequestException('Solo se pueden editar instancias enviadas.');
    }

    const perm = this.getPermisoForUser(instancia.formulario, user);
    if (!perm?.canEdit) {
      throw new ForbiddenException(
        'No tienes permiso para editar esta instancia.',
      );
    }
    if (!this.puedeVerInstancia(user, instancia, perm, instancia.formulario)) {
      throw new ForbiddenException('No puedes editar esta instancia.');
    }

    if (
      instancia.borradorEdicionPorIdUsuario &&
      instancia.borradorEdicionPorIdUsuario !== user.idUsuario
    ) {
      const editor = instancia.borradorEdicionPor
        ? this.toUsuarioResumen(instancia.borradorEdicionPor)
        : null;
      throw new ForbiddenException(
        `${editor?.nombreCompleto || 'Otro usuario'} está editando esta instancia.`,
      );
    }

    const mergedDef = this.mergeDefinicionForEdit(
      instancia.definicionSnapshot,
      instancia.formulario.definicionPublicada,
    );

    if (!instancia.borradorEdicionPorIdUsuario) {
      instancia.borradorEdicionPorIdUsuario = user.idUsuario;
      instancia.borradorEdicionRespuestas = JSON.parse(
        JSON.stringify(instancia.respuestas ?? {}),
      );
      instancia.borradorEdicionDefinicion = mergedDef;
      instancia.borradorEdicionEn = new Date();
    } else if (respuestas !== undefined && respuestas !== null) {
      // Solo actualizar respuestas cuando el cliente envía un payload de guardado.
      instancia.borradorEdicionRespuestas = respuestas;
      instancia.borradorEdicionEn = new Date();
      if (!instancia.borradorEdicionDefinicion) {
        instancia.borradorEdicionDefinicion = mergedDef;
      }
    } else if (respuestas === undefined) {
      // Reabrir borrador propio vacío: reseedar desde la instancia publicada.
      const draftKeys = Object.keys(instancia.borradorEdicionRespuestas ?? {});
      const instanceKeys = Object.keys(instancia.respuestas ?? {});
      if (draftKeys.length === 0 && instanceKeys.length > 0) {
        instancia.borradorEdicionRespuestas = JSON.parse(
          JSON.stringify(instancia.respuestas),
        );
        instancia.borradorEdicionDefinicion =
          instancia.borradorEdicionDefinicion || mergedDef;
        instancia.borradorEdicionEn = new Date();
      } else if (!instancia.borradorEdicionDefinicion) {
        instancia.borradorEdicionDefinicion = mergedDef;
      }
    }

    await this.instanciasRepository.save(instancia);
    return this.toInstanciaResponse(
      await this.findInstanciaEntity(id, { includeEditDraft: true }),
      user,
      { includeVersiones: true },
    );
  }

  async commitEdit(id: number, user: AuthUser, respuestas?: Record<string, unknown>) {
    const instancia = await this.findInstanciaEntity(id, {
      includeEditDraft: true,
    });
    if (instancia.deletedAt) {
      throw new BadRequestException('No se puede editar una instancia eliminada.');
    }

    const perm = this.getPermisoForUser(instancia.formulario, user);
    if (!perm?.canEdit) {
      throw new ForbiddenException(
        'No tienes permiso para editar esta instancia.',
      );
    }
    if (
      instancia.borradorEdicionPorIdUsuario &&
      instancia.borradorEdicionPorIdUsuario !== user.idUsuario
    ) {
      throw new ForbiddenException(
        'Otro usuario tiene el borrador de edición de esta instancia.',
      );
    }
    if (
      !instancia.borradorEdicionPorIdUsuario &&
      respuestas === undefined
    ) {
      throw new BadRequestException('No hay borrador de edición para guardar.');
    }

    const mergedDef =
      instancia.borradorEdicionDefinicion ||
      this.mergeDefinicionForEdit(
        instancia.definicionSnapshot,
        instancia.formulario.definicionPublicada,
      );
    const nextRespuestas =
      respuestas ??
      instancia.borradorEdicionRespuestas ??
      instancia.respuestas ??
      {};

    instancia.respuestas = nextRespuestas;
    instancia.definicionSnapshot = mergedDef;
    instancia.borradorEdicionRespuestas = null;
    instancia.borradorEdicionDefinicion = null;
    instancia.borradorEdicionPorIdUsuario = null;
    instancia.borradorEdicionPor = null;
    instancia.borradorEdicionEn = null;

    await this.instanciasRepository.save(instancia);
    await this.createVersionSnapshot(instancia, user.idUsuario);

    return this.toInstanciaResponse(
      await this.findInstanciaEntity(id, { includeEditDraft: true }),
      user,
      { includeVersiones: true },
    );
  }

  async discardEditDraft(id: number, user: AuthUser) {
    const instancia = await this.findInstanciaEntity(id, {
      includeEditDraft: true,
    });
    if (
      instancia.borradorEdicionPorIdUsuario &&
      instancia.borradorEdicionPorIdUsuario !== user.idUsuario
    ) {
      throw new ForbiddenException(
        'Solo quien tiene el borrador de edición puede descartarlo.',
      );
    }

    // update() evita que TypeORM reescriba el FK desde la relación cargada.
    await this.instanciasRepository.update(
      { idInstancia: id },
      {
        borradorEdicionRespuestas: null,
        borradorEdicionDefinicion: null,
        borradorEdicionPorIdUsuario: null,
        borradorEdicionEn: null,
      },
    );

    return this.toInstanciaResponse(
      await this.findInstanciaEntity(id, { includeEditDraft: true }),
      user,
      { includeVersiones: true },
    );
  }

  async removeInstancia(id: number, user: AuthUser) {
    const instancia = await this.findInstanciaEntity(id, { withDeleted: true });
    const perm = this.getPermisoForUser(instancia.formulario, user);
    const isOwner = instancia.quienLlenoIdUsuario === user.idUsuario;
    const isDraft = this.isDraftEstado(instancia.estado);

    if (instancia.deletedAt) {
      throw new BadRequestException('La instancia ya está eliminada.');
    }

    if (isDraft) {
      if (!isOwner) {
        throw new ForbiddenException(
          'Solo quien está llenando este borrador puede eliminarlo.',
        );
      }
      await this.instanciasRepository.softDelete({ idInstancia: id });
      return { deleted: true, idInstancia: id };
    }

    if (!perm?.canDelete) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar instancias de este formulario.',
      );
    }
    if (!this.puedeVerInstancia(user, instancia, perm, instancia.formulario)) {
      throw new ForbiddenException('No puedes eliminar esta instancia.');
    }
    if (
      instancia.formulario.visibilidadInstancias === 'privado' &&
      !isOwner
    ) {
      throw new ForbiddenException(
        'Solo quien llenó esta instancia privada puede eliminarla.',
      );
    }

    // Limpiar borrador de edición al eliminar
    await this.instanciasRepository.update(
      { idInstancia: id },
      {
        borradorEdicionRespuestas: null,
        borradorEdicionDefinicion: null,
        borradorEdicionPorIdUsuario: null,
        borradorEdicionEn: null,
      },
    );
    await this.instanciasRepository.softDelete({ idInstancia: id });
    return { deleted: true, idInstancia: id };
  }

  async restoreInstancia(id: number, user: AuthUser) {
    const instancia = await this.findInstanciaEntity(id, { withDeleted: true });
    if (!instancia.deletedAt) {
      throw new BadRequestException('La instancia no está eliminada.');
    }

    const perm = this.getPermisoForUser(instancia.formulario, user);
    if (!perm?.canDelete) {
      throw new ForbiddenException(
        'No tienes permiso para recuperar instancias eliminadas.',
      );
    }

    const formulario = instancia.formulario;
    const enviadosActivos = await this.instanciasRepository.count({
      where: {
        idFormulario: formulario.idFormulario,
        paraQuienIdUsuario: instancia.paraQuienIdUsuario,
        estado: 'enviado',
      },
    });

    if (this.isAtFillLimit(formulario, enviadosActivos)) {
      if (formulario.fillMode === 'single') {
        // Auto-swap: deshabilitar la hábil y recuperar esta
        const activa = await this.instanciasRepository.findOne({
          where: {
            idFormulario: formulario.idFormulario,
            paraQuienIdUsuario: instancia.paraQuienIdUsuario,
            estado: 'enviado',
          },
        });
        if (activa && activa.idInstancia !== id) {
          await this.instanciasRepository.softDelete({
            idInstancia: activa.idInstancia,
          });
        }
      } else if (formulario.fillMode === 'limited') {
        // Auto-swap: deshabilitar la más reciente hábil
        const activas = await this.instanciasRepository.find({
          where: {
            idFormulario: formulario.idFormulario,
            paraQuienIdUsuario: instancia.paraQuienIdUsuario,
            estado: 'enviado',
          },
          order: { updatedAt: 'DESC' },
          take: 1,
        });
        if (activas[0] && activas[0].idInstancia !== id) {
          await this.instanciasRepository.softDelete({
            idInstancia: activas[0].idInstancia,
          });
        }
      }
    }

    await this.instanciasRepository.restore({ idInstancia: id });
    return this.toInstanciaResponse(
      await this.findInstanciaEntity(id, {
        withDeleted: true,
        includeEditDraft: true,
      }),
      user,
      { includeVersiones: true },
    );
  }

  async pacientesResumen(user: AuthUser) {
    if (!this.isStaffRole(user.rol)) {
      throw new ForbiddenException(
        'Solo personal clínico/administrativo puede ver este listado.',
      );
    }

    const rolId = await this.requireRolId(user);
    const viewableFormIds = await this.getFormIdsWithPermission(rolId, 'canView');
    const viewableForms =
      viewableFormIds.length > 0
        ? await this.formulariosRepository.find({
            where: { idFormulario: In(viewableFormIds) },
          })
        : [];

    const categoryViewable = {
      historial: viewableForms.some((f) => f.categoria === 'historial'),
      encuesta: viewableForms.some((f) => f.categoria === 'encuesta'),
      operativo: viewableForms.some((f) => f.categoria === 'operativo'),
    };

    const pacientes = await this.usuariosRepository
      .createQueryBuilder('u')
      .innerJoinAndSelect('u.persona', 'p')
      .leftJoinAndSelect('p.asignacionesRoles', 'ar')
      .leftJoinAndSelect('ar.rol', 'r')
      .where('u.deletedAt IS NULL')
      .andWhere('ar.activo = true')
      .andWhere('r.nombre IN (:...roles)', { roles: PATIENT_ROLES })
      .orderBy('p.nombres', 'ASC')
      .addOrderBy('p.primerApellido', 'ASC')
      .getMany();

    const instancias =
      viewableFormIds.length > 0
        ? await this.instanciasRepository.find({
            where: {
              idFormulario: In(viewableFormIds),
              estado: 'enviado',
            },
            relations: ['formulario'],
          })
        : [];

    const visibleByPatient = new Map<
      number,
      { historial: number; encuesta: number; operativo: number }
    >();

    for (const inst of instancias) {
      const form = inst.formulario;
      if (!form || form.deletedAt || !form.categoria) continue;

      const isPrivate = form.visibilidadInstancias === 'privado';
      if (isPrivate && inst.quienLlenoIdUsuario !== user.idUsuario) continue;

      const counts = visibleByPatient.get(inst.paraQuienIdUsuario) ?? {
        historial: 0,
        encuesta: 0,
        operativo: 0,
      };
      if (form.categoria === 'historial') counts.historial += 1;
      if (form.categoria === 'encuesta') counts.encuesta += 1;
      if (form.categoria === 'operativo') counts.operativo += 1;
      visibleByPatient.set(inst.paraQuienIdUsuario, counts);
    }

    return pacientes.map((usuario) => {
      const persona = usuario.persona;
      const counts = visibleByPatient.get(usuario.idUsuario) ?? {
        historial: 0,
        encuesta: 0,
        operativo: 0,
      };
      return {
        idUsuario: usuario.idUsuario,
        idPersona: persona?.idPersona ?? null,
        nombres: persona?.nombres ?? '',
        primerApellido: persona?.primerApellido ?? '',
        segundoApellido: persona?.segundoApellido ?? '',
        nombreCompleto: this.formatPersonaName(persona),
        foto: persona?.foto ?? null,
        iniciales: this.getInitials(persona),
        categorias: {
          historial: {
            count: counts.historial,
            visible: categoryViewable.historial,
          },
          encuesta: {
            count: counts.encuesta,
            visible: categoryViewable.encuesta,
          },
          operativo: {
            count: counts.operativo,
            visible: categoryViewable.operativo,
          },
        },
      };
    });
  }

  async pacienteInstancias(
    idUsuarioPaciente: number,
    user: AuthUser,
    categoria?: string,
  ) {
    if (!this.isStaffRole(user.rol)) {
      throw new ForbiddenException(
        'Solo personal clínico/administrativo puede ver este listado.',
      );
    }

    const rolId = await this.requireRolId(user);
    const viewableFormIds = await this.getFormIdsWithPermission(rolId, 'canView');
    if (!viewableFormIds.length) return [];

    const qb = this.instanciasRepository
      .createQueryBuilder('i')
      .withDeleted()
      .innerJoinAndSelect('i.formulario', 'f')
      .leftJoinAndSelect('f.permisos', 'p')
      .leftJoinAndSelect('p.rol', 'rol')
      .leftJoinAndSelect('i.quienLleno', 'quien')
      .leftJoinAndSelect('quien.persona', 'quienPersona')
      .leftJoinAndSelect('i.paraQuien', 'para')
      .leftJoinAndSelect('para.persona', 'paraPersona')
      .andWhere('i.paraQuienIdUsuario = :idPaciente', {
        idPaciente: idUsuarioPaciente,
      })
      .andWhere('i.idFormulario IN (:...ids)', { ids: viewableFormIds })
      .andWhere('i.estado = :estado', { estado: 'enviado' })
      .orderBy('i.updatedAt', 'DESC');

    if (categoria && CATEGORIAS.includes(categoria as any)) {
      qb.andWhere('f.categoria = :categoria', { categoria });
    }

    const instancias = await qb.getMany();
    const results: any[] = [];
    for (const inst of instancias) {
      const perm = this.getPermisoForUser(inst.formulario, user);
      const isDeleted = Boolean(inst.deletedAt);
      if (isDeleted && !perm?.canDelete) continue;
      if (
        !isDeleted &&
        !this.puedeVerInstancia(user, inst, perm, inst.formulario)
      ) {
        continue;
      }
      results.push(await this.toInstanciaResponse(inst, user));
    }
    return results;
  }

  // --- helpers ---

  private async seedDefaultPermisos(idFormulario: number) {
    const roles = await this.rolesRepository.find({
      where: { nombre: In(DEFAULT_FULL_PERM_ROLES) },
    });
    if (!roles.length) return;

    const entities = roles.map((rol) =>
      this.permisosRepository.create({
        idFormulario,
        idRol: rol.idRol,
        canView: true,
        canFill: true,
        canEdit: true,
        canDelete: true,
      }),
    );
    await this.permisosRepository.save(entities);
  }

  private async countFormsWithPermission(
    user: AuthUser,
    flag: 'canView' | 'canFill',
    onlyPublished = false,
  ) {
    if (!user.rolId && !user.rol) return 0;
    const rolId = await this.requireRolId(user);
    const column =
      flag === 'canView' ? 'p.canView = true' : 'p.canFill = true';

    const qb = this.formulariosRepository
      .createQueryBuilder('f')
      .innerJoin('f.permisos', 'p', `p.idRol = :rolId AND ${column}`, {
        rolId,
      })
      .where('f.deletedAt IS NULL');

    if (onlyPublished) {
      qb.andWhere('f.estado = :estado', { estado: 'publicado' }).andWhere(
        'f.definicionPublicada IS NOT NULL',
      );
    }

    return qb.getCount();
  }

  private async getFormIdsWithPermission(
    rolId: number,
    flag: 'canView' | 'canFill',
  ) {
    const column = flag === 'canView' ? 'canView' : 'canFill';
    const rows = await this.permisosRepository
      .createQueryBuilder('p')
      .select('p.idFormulario', 'idFormulario')
      .where(`p.${column} = true`)
      .andWhere('p.idRol = :rolId', { rolId })
      .getRawMany<{ idFormulario: number }>();
    return rows.map((r) => Number(r.idFormulario));
  }

  private async getPermisosMapForRol(formIds: number[], rolId: number) {
    const map = new Map<number, FormularioPermisoRol>();
    if (!formIds.length) return map;
    const rows = await this.permisosRepository.find({
      where: { idFormulario: In(formIds), idRol: rolId },
    });
    for (const row of rows) map.set(row.idFormulario, row);
    return map;
  }

  private async requireRolId(user: AuthUser) {
    if (user.rolId) return user.rolId;
    if (!user.rol) {
      throw new ForbiddenException('No hay rol activo en la sesión.');
    }
    const rol = await this.rolesRepository.findOne({
      where: { nombre: user.rol },
    });
    if (!rol) {
      throw new ForbiddenException('Rol activo no encontrado.');
    }
    return rol.idRol;
  }

  private getPermisoForUser(formulario: Formulario, user: AuthUser) {
    if (!formulario.permisos?.length) return null;
    if (user.rolId) {
      return formulario.permisos.find((p) => p.idRol === user.rolId) ?? null;
    }
    if (user.rol) {
      return (
        formulario.permisos.find((p) => p.rol?.nombre === user.rol) ?? null
      );
    }
    return null;
  }

  private puedeVerInstancia(
    user: AuthUser,
    instancia: FormularioInstancia,
    perm: FormularioPermisoRol | null | undefined,
    formulario: Formulario,
  ) {
    // Borradores: solo quien los está llenando
    if (this.isDraftEstado(instancia.estado)) {
      return instancia.quienLlenoIdUsuario === user.idUsuario;
    }

    if (formulario.visibilidadInstancias === 'privado') {
      return instancia.quienLlenoIdUsuario === user.idUsuario;
    }

    if (!perm?.canView) return false;

    if (this.isPatientRole(user.rol)) {
      return (
        instancia.paraQuienIdUsuario === user.idUsuario ||
        instancia.quienLlenoIdUsuario === user.idUsuario
      );
    }

    return true;
  }

  private async resolveParaQuien(
    requestedId: number | undefined,
    user: AuthUser,
  ) {
    if (this.isPatientRole(user.rol)) {
      return user.idUsuario;
    }

    if (this.canFillForPatient(user.rol)) {
      if (!requestedId) {
        throw new BadRequestException(
          'Debes indicar el paciente destinatario (paraQuién).',
        );
      }
      await this.assertPacienteUsuario(requestedId);
      return requestedId;
    }

    // Director u otros con canFill: solo para sí mismos
    if (requestedId && requestedId !== user.idUsuario) {
      throw new ForbiddenException(
        'Tu rol no puede llenar formularios para otros pacientes.',
      );
    }
    return user.idUsuario;
  }

  private async assertPacienteUsuario(idUsuario: number) {
    const usuario = await this.usuariosRepository.findOne({
      where: { idUsuario },
      relations: ['persona', 'persona.asignacionesRoles', 'persona.asignacionesRoles.rol'],
    });
    if (!usuario) {
      throw new NotFoundException('Paciente no encontrado.');
    }
    const roles =
      usuario.persona?.asignacionesRoles
        ?.filter((ar) => ar.activo !== false)
        .map((ar) => ar.rol?.nombre) ?? [];
    if (!roles.some((r) => PATIENT_ROLES.includes(r))) {
      throw new BadRequestException(
        'El usuario indicado no es un paciente del sistema.',
      );
    }
  }

  private normalizeInstanciaEstado(
    estado?: string | null,
  ): 'guardado' | 'enviado' {
    if (estado === 'enviado') return 'enviado';
    // Compatibilidad con valor anterior "borrador"
    return 'guardado';
  }

  private isDraftEstado(estado?: string | null) {
    return estado === 'guardado' || estado === 'borrador';
  }

  private isAtFillLimit(formulario: Formulario, enviadosCount: number) {
    if (formulario.fillMode === 'unlimited') return false;
    if (formulario.fillMode === 'single') return enviadosCount >= 1;
    if (
      formulario.fillMode === 'limited' &&
      formulario.fillLimit != null
    ) {
      return enviadosCount >= formulario.fillLimit;
    }
    return false;
  }

  private async assertFillLimit(
    formulario: Formulario,
    paraQuienId: number,
    excludeInstanciaId?: number,
  ) {
    if (formulario.fillMode === 'unlimited') return;

    const qb = this.instanciasRepository
      .createQueryBuilder('i')
      .where('i.idFormulario = :idFormulario', {
        idFormulario: formulario.idFormulario,
      })
      .andWhere('i.paraQuienIdUsuario = :paraQuienId', { paraQuienId })
      .andWhere('i.estado = :estado', { estado: 'enviado' });

    if (excludeInstanciaId) {
      qb.andWhere('i.idInstancia != :excludeId', {
        excludeId: excludeInstanciaId,
      });
    }

    const count = await qb.getCount();

    if (formulario.fillMode === 'single' && count >= 1) {
      throw new BadRequestException(
        `Ese usuario ya tiene un formulario de "${formulario.titulo}" guardado.`,
      );
    }

    if (
      formulario.fillMode === 'limited' &&
      formulario.fillLimit != null &&
      count >= formulario.fillLimit
    ) {
      throw new BadRequestException(
        `Se alcanzó el límite de ${formulario.fillLimit} envíos de "${formulario.titulo}" para este destinatario.`,
      );
    }
  }

  private canFillForPatient(rol?: string) {
    return Boolean(rol && CAN_FILL_FOR_PATIENT_ROLES.includes(rol));
  }

  private isPatientRole(rol?: string) {
    return Boolean(rol && PATIENT_ROLES.includes(rol));
  }

  private isStaffRole(rol?: string) {
    return Boolean(
      rol &&
        ['SUPERUSUARIO', 'DIRECTOR', 'DOCTOR'].includes(rol),
    );
  }

  private async findEntity(id: number) {
    const formulario = await this.formulariosRepository.findOne({
      where: { idFormulario: id },
      relations: [
        'permisos',
        'permisos.rol',
        'ultimoGuardadoPor',
        'ultimoGuardadoPor.persona',
        'ultimoGuardadoPor.persona.asignacionesRoles',
        'ultimoGuardadoPor.persona.asignacionesRoles.rol',
        'ultimoPublicadoPor',
        'ultimoPublicadoPor.persona',
        'ultimoPublicadoPor.persona.asignacionesRoles',
        'ultimoPublicadoPor.persona.asignacionesRoles.rol',
      ],
    });
    if (!formulario) {
      throw new NotFoundException(`Formulario con ID ${id} no encontrado.`);
    }
    return formulario;
  }

  private async findInstanciaEntity(
    id: number,
    opts: { withDeleted?: boolean; includeEditDraft?: boolean } = {},
  ) {
    const relations = [
      'formulario',
      'formulario.permisos',
      'formulario.permisos.rol',
      'quienLleno',
      'quienLleno.persona',
      'paraQuien',
      'paraQuien.persona',
    ];
    if (opts.includeEditDraft) {
      relations.push('borradorEdicionPor', 'borradorEdicionPor.persona');
    }

    const instancia = await this.instanciasRepository.findOne({
      where: { idInstancia: id },
      relations,
      withDeleted: Boolean(opts.withDeleted),
    });
    if (!instancia || instancia.formulario?.deletedAt) {
      throw new NotFoundException(`Instancia con ID ${id} no encontrada.`);
    }
    return instancia;
  }

  private async replacePermisos(
    idFormulario: number,
    permisos: UpdateFormularioDto['permisos'],
  ) {
    await this.permisosRepository.delete({ idFormulario });

    if (!permisos?.length) return;

    const entities = permisos.map((permiso) =>
      this.permisosRepository.create({
        idFormulario,
        idRol: permiso.idRol,
        canView: Boolean(permiso.canView),
        canFill: Boolean(permiso.canFill),
        canEdit: Boolean(permiso.canEdit),
        canDelete: Boolean(permiso.canDelete),
      }),
    );
    await this.permisosRepository.save(entities);
  }

  private assertDefinicionShape(
    definicion: UpdateFormularioDto['definicionBorrador'],
  ) {
    if (!definicion || !Array.isArray(definicion.sections)) {
      throw new BadRequestException('La definición del formulario es inválida.');
    }
  }

  private hasUnpublishedChanges(formulario: Formulario) {
    if (!formulario.definicionPublicada) return false;
    return (
      JSON.stringify(formulario.definicionBorrador) !==
      JSON.stringify(formulario.definicionPublicada)
    );
  }

  private formatPersonaName(persona?: {
    nombres?: string;
    primerApellido?: string;
    segundoApellido?: string | null;
  } | null) {
    if (!persona) return '';
    return [persona.nombres, persona.primerApellido, persona.segundoApellido]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private getInitials(persona?: {
    nombres?: string;
    primerApellido?: string;
  } | null) {
    if (!persona) return '?';
    const a = persona.nombres?.trim()?.[0] ?? '';
    const b = persona.primerApellido?.trim()?.[0] ?? '';
    return `${a}${b}`.toUpperCase() || '?';
  }

  private toUsuarioResumen(usuario?: Usuario | null) {
    if (!usuario) return null;
    return {
      idUsuario: usuario.idUsuario,
      nombreCompleto: this.formatPersonaName(usuario.persona),
      foto: usuario.persona?.foto ?? null,
      iniciales: this.getInitials(usuario.persona),
    };
  }

  private toAuditActor(
    usuario?: Usuario | null,
    fecha?: Date | null,
    accion?: string,
  ) {
    if (!usuario && !fecha) return null;
    const roles =
      usuario?.persona?.asignacionesRoles
        ?.filter((ar) => ar.activo !== false && ar.rol?.nombre)
        .map((ar) => ar.rol.nombre) ?? [];
    return {
      idUsuario: usuario?.idUsuario ?? null,
      nombreCompleto: this.formatPersonaName(usuario?.persona) || null,
      roles,
      rol: roles[0] ?? null,
      fecha: fecha ?? null,
      accion: accion ?? null,
    };
  }

  private toListItem(formulario: Formulario) {
    const sections = formulario.definicionBorrador?.sections ?? [];
    const fieldCount = sections.reduce(
      (total, section) => total + (section.fields?.length ?? 0),
      0,
    );

    return {
      id: formulario.idFormulario,
      idFormulario: formulario.idFormulario,
      titulo: formulario.titulo,
      descripcion: formulario.descripcion,
      categoria: formulario.categoria,
      estado: formulario.estado,
      fillMode: formulario.fillMode,
      fillLimit: formulario.fillLimit,
      visibilidadInstancias: formulario.visibilidadInstancias ?? 'publico',
      sectionCount: sections.length,
      fieldCount,
      hasPublished: Boolean(formulario.definicionPublicada),
      hasUnpublishedChanges: this.hasUnpublishedChanges(formulario),
      publicadoEn: formulario.publicadoEn,
      guardadoEn: formulario.guardadoEn,
      updatedAt: formulario.updatedAt,
      createdAt: formulario.createdAt,
    };
  }

  private toFillListItem(formulario: Formulario) {
    const sections = formulario.definicionPublicada?.sections ?? [];
    const fieldCount = sections.reduce(
      (total, section) => total + (section.fields?.length ?? 0),
      0,
    );

    return {
      id: formulario.idFormulario,
      idFormulario: formulario.idFormulario,
      titulo: formulario.titulo,
      descripcion: formulario.descripcion,
      categoria: formulario.categoria,
      estado: formulario.estado,
      fillMode: formulario.fillMode,
      fillLimit: formulario.fillLimit,
      visibilidadInstancias: formulario.visibilidadInstancias ?? 'publico',
      sectionCount: sections.length,
      fieldCount,
      publicadoEn: formulario.publicadoEn,
    };
  }

  private toDetailResponse(formulario: Formulario) {
    return {
      ...this.toListItem(formulario),
      title: formulario.titulo,
      formHeaderTitle: formulario.titulo,
      builderDescription: formulario.descripcion,
      status: formulario.estado === 'publicado' ? 'Publicado' : 'Borrador',
      statusColor: formulario.estado === 'publicado' ? 'success' : 'warning',
      definicionBorrador: formulario.definicionBorrador,
      definicionPublicada: formulario.definicionPublicada,
      sections: formulario.definicionBorrador?.sections ?? [],
      permisos: (formulario.permisos ?? []).map((permiso) => ({
        idRol: permiso.idRol,
        nombre: permiso.rol?.nombre ?? null,
        canView: permiso.canView,
        canFill: permiso.canFill,
        canEdit: permiso.canEdit,
        canDelete: permiso.canDelete,
      })),
      auditoria: {
        ultimoGuardado: this.toAuditActor(
          formulario.ultimoGuardadoPor,
          formulario.guardadoEn,
          'Guardó/editó',
        ),
        ultimaPublicacion: this.toAuditActor(
          formulario.ultimoPublicadoPor,
          formulario.publicadoEn,
          'Publicó',
        ),
      },
    };
  }

  private async createVersionSnapshot(
    instancia: FormularioInstancia,
    editorIdUsuario: number,
  ) {
    const version = this.versionesRepository.create({
      idInstancia: instancia.idInstancia,
      editadoPorIdUsuario: editorIdUsuario,
      respuestas: JSON.parse(JSON.stringify(instancia.respuestas ?? {})),
      definicionSnapshot: JSON.parse(
        JSON.stringify(instancia.definicionSnapshot),
      ),
    });
    await this.versionesRepository.save(version);
    return version;
  }

  private mergeDefinicionForEdit(
    snapshot: FormularioDefinicion | null | undefined,
    publicada: FormularioDefinicion | null | undefined,
  ): FormularioDefinicion {
    const base = JSON.parse(
      JSON.stringify(snapshot || { sections: [] }),
    ) as FormularioDefinicion;
    const pub = publicada || { sections: [] };
    const baseSectionIds = new Set((base.sections || []).map((s) => s.id));
    for (const section of pub.sections || []) {
      if (!baseSectionIds.has(section.id)) {
        base.sections.push(JSON.parse(JSON.stringify(section)));
      } else {
        const existing = base.sections.find((s) => s.id === section.id);
        if (!existing) continue;
        const fieldIds = new Set((existing.fields || []).map((f) => f.id));
        for (const field of section.fields || []) {
          if (!fieldIds.has(field.id)) {
            existing.fields = existing.fields || [];
            existing.fields.push(JSON.parse(JSON.stringify(field)));
          }
        }
      }
    }
    return base;
  }

  /**
   * Secciones para vista: snapshot + secciones nuevas de publicada (vacías)
   * + campos del snapshot que ya no están en publicada marcados eliminados.
   */
  private buildSectionsForView(
    snapshot: FormularioDefinicion | null | undefined,
    publicada: FormularioDefinicion | null | undefined,
    respuestas: Record<string, unknown>,
  ) {
    const snap = snapshot || { sections: [] };
    const pub = publicada || { sections: [] };
    const pubFieldIds = new Set(
      (pub.sections || []).flatMap((s) => (s.fields || []).map((f) => f.id)),
    );
    const pubSectionIds = new Set((pub.sections || []).map((s) => s.id));

    const sections = (snap.sections || []).map((section) => ({
      ...section,
      isNew: false,
      fields: (section.fields || []).map((field) => ({
        ...field,
        eliminated: !pubFieldIds.has(field.id),
        value: respuestas?.[field.id],
      })),
    }));

    for (const section of pub.sections || []) {
      if (!pubSectionIds.has(section.id)) continue;
      const exists = sections.find((s) => s.id === section.id);
      if (!exists) {
        sections.push({
          ...JSON.parse(JSON.stringify(section)),
          isNew: true,
          fields: (section.fields || []).map((field) => ({
            ...field,
            eliminated: false,
            value: respuestas?.[field.id] ?? null,
          })),
        });
      } else {
        const existingFieldIds = new Set(exists.fields.map((f) => f.id));
        for (const field of section.fields || []) {
          if (!existingFieldIds.has(field.id)) {
            exists.fields.push({
              ...field,
              eliminated: false,
              value: respuestas?.[field.id] ?? null,
            });
          }
        }
      }
    }

    // Secciones nuevas (en publicada, no en snapshot)
    for (const section of pub.sections || []) {
      if (sections.some((s) => s.id === section.id)) continue;
      sections.push({
        ...JSON.parse(JSON.stringify(section)),
        isNew: true,
        fields: (section.fields || []).map((field) => ({
          ...field,
          eliminated: false,
          value: null,
        })),
      });
    }

    return sections;
  }

  private async assertNoDraftBlockingCupo(
    formulario: Formulario,
    paraQuienId: number,
    currentUserId: number,
  ) {
    if (formulario.fillMode === 'unlimited') return;

    const enviados = await this.instanciasRepository.count({
      where: {
        idFormulario: formulario.idFormulario,
        paraQuienIdUsuario: paraQuienId,
        estado: 'enviado',
      },
    });

    const otrosBorradores = await this.instanciasRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.quienLleno', 'quien')
      .leftJoinAndSelect('quien.persona', 'persona')
      .where('i.idFormulario = :idFormulario', {
        idFormulario: formulario.idFormulario,
      })
      .andWhere('i.paraQuienIdUsuario = :paraQuienId', { paraQuienId })
      .andWhere('i.estado IN (:...estados)', { estados: ['guardado', 'borrador'] })
      .andWhere('i.quienLlenoIdUsuario != :uid', { uid: currentUserId })
      .getMany();

    const occupied = enviados + otrosBorradores.length;
    if (!this.isAtFillLimit(formulario, occupied)) return;

    const who = otrosBorradores[0]
      ? this.toUsuarioResumen(otrosBorradores[0].quienLleno)
      : null;
    if (who) {
      throw new BadRequestException(
        `${who.nombreCompleto} está en proceso de llenado de este formulario y no hay cupos disponibles.`,
      );
    }
    throw new BadRequestException(
      `Ese usuario ya tiene un formulario de "${formulario.titulo}" guardado.`,
    );
  }

  private async toInstanciaResponse(
    instancia: FormularioInstancia,
    user: AuthUser,
    opts: { includeVersiones?: boolean } = {},
  ) {
    const form = instancia.formulario;
    const perm = this.getPermisoForUser(form, user);
    const isDeleted = Boolean(instancia.deletedAt);
    const canViewBase =
      isDeleted
        ? Boolean(perm?.canDelete)
        : this.puedeVerInstancia(user, instancia, perm, form);

    const sections = this.buildSectionsForView(
      instancia.definicionSnapshot,
      form?.definicionPublicada,
      instancia.respuestas ?? {},
    );

    let editores: Array<{
      idVersion: number;
      idUsuario: number;
      nombreCompleto: string;
      fecha: Date;
      esUltimo: boolean;
    }> = [];

    if (opts.includeVersiones && instancia.estado === 'enviado') {
      const versiones = await this.versionesRepository.find({
        where: { idInstancia: instancia.idInstancia },
        relations: ['editadoPor', 'editadoPor.persona'],
        order: { createdAt: 'ASC' },
      });
      editores = versiones.map((v, idx) => ({
        idVersion: v.idVersion,
        idUsuario: v.editadoPorIdUsuario,
        nombreCompleto:
          this.formatPersonaName(v.editadoPor?.persona) || 'Usuario',
        fecha: v.createdAt,
        esUltimo: idx === versiones.length - 1,
      }));
    }

    const borradorAjeno =
      instancia.borradorEdicionPorIdUsuario &&
      instancia.borradorEdicionPorIdUsuario !== user.idUsuario
        ? this.toUsuarioResumen(instancia.borradorEdicionPor)
        : null;

    const isOwnEditDraft =
      instancia.borradorEdicionPorIdUsuario === user.idUsuario;

    return {
      idInstancia: instancia.idInstancia,
      idFormulario: instancia.idFormulario,
      estado: instancia.estado,
      eliminado: isDeleted,
      respuestas: instancia.respuestas ?? {},
      definicionSnapshot: instancia.definicionSnapshot,
      sections,
      createdAt: instancia.createdAt,
      updatedAt: instancia.updatedAt,
      deletedAt: instancia.deletedAt,
      quienLleno: this.toUsuarioResumen(instancia.quienLleno),
      paraQuien: this.toUsuarioResumen(instancia.paraQuien),
      editores,
      ultimoEditor: editores.length
        ? editores[editores.length - 1]
        : instancia.quienLleno
          ? {
              idVersion: null,
              idUsuario: instancia.quienLlenoIdUsuario,
              nombreCompleto:
                this.formatPersonaName(instancia.quienLleno.persona) ||
                'Usuario',
              fecha: instancia.createdAt,
              esUltimo: true,
            }
          : null,
      borradorEdicion: isOwnEditDraft
        ? {
            respuestas: instancia.borradorEdicionRespuestas ?? {},
            definicion: instancia.borradorEdicionDefinicion,
            updatedAt: instancia.borradorEdicionEn,
            sections: this.buildSectionsForView(
              instancia.borradorEdicionDefinicion ||
                instancia.definicionSnapshot,
              form?.definicionPublicada,
              instancia.borradorEdicionRespuestas ?? {},
            ),
          }
        : null,
      borradorEdicionPor: borradorAjeno,
      formulario: form
        ? {
            idFormulario: form.idFormulario,
            titulo: form.titulo,
            categoria: form.categoria,
            visibilidadInstancias: form.visibilidadInstancias,
            fillMode: form.fillMode,
            fillLimit: form.fillLimit,
            definicionPublicada: form.definicionPublicada,
          }
        : null,
      canEdit:
        !isDeleted &&
        instancia.estado === 'enviado' &&
        Boolean(perm?.canEdit) &&
        canViewBase &&
        (!instancia.borradorEdicionPorIdUsuario ||
          instancia.borradorEdicionPorIdUsuario === user.idUsuario),
      canDelete: Boolean(perm?.canDelete) && (canViewBase || isDeleted),
      versionSeleccionada: null as any,
    };
  }
}
