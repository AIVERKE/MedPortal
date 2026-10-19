<template>
    <v-card flat class="fill-height d-flex flex-column bg-transparent">
        <!-- Content Area -->
        <v-card-text class="flex-grow-1 overflow-y-auto pa-4 pa-md-8 px-lg-12">
            <div class="max-width-form mx-auto pb-12">
                <header class="d-flex align-center justify-space-between mb-8 mt-2">
                    <div class="d-flex align-center ga-4">
                        <v-btn v-if="isMobile" icon="mdi-chevron-left" variant="flat"
                            class="bg-white border elevation-1 rounded-lg" @click="$emit('cancel')"></v-btn>
                        <div>
                            <h3 class="text-h4 font-weight-black text-grey-darken-4 tracking-tight">
                                Perfil de Usuario
                            </h3>
                            <p class="text-subtitle-2 font-weight-medium text-grey-darken-1">
                                Control de acceso y datos personales
                            </p>
                        </div>
                    </div>

                    <!-- Status Toggle Switch -->
                    <div class="status-toggle-wrapper px-4 py-2 rounded-xl border bg-white shadow-sm d-flex align-center ga-3"
                        :class="{ 'border-success': localUser.activo, 'border-error': !localUser.activo }">
                        <span class="text-caption font-weight-black text-uppercase"
                            :class="localUser.activo ? 'text-success' : 'text-error'">
                            {{ localUser.activo ? 'Cuenta Activa' : 'Cuenta Inactiva' }}
                        </span>
                        <v-switch v-model="localUser.activo" hide-details density="compact" color="success"
                            @click.prevent="onToggleStatusClick"></v-switch>
                    </div>
                </header>

                <div v-if="localUser" class="d-flex flex-column ga-6">
                    <!-- User Management Status -->
                    <v-sheet border rounded="xl" class="pa-4 user-status-card" :class="{ 'no-user': !hasUser }">
                        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
                            <div class="d-flex align-center ga-3">
                                <v-icon :color="hasUser ? 'success' : 'warning'" size="28">
                                    {{ hasUser ? 'mdi-account-check' : 'mdi-account-alert' }}
                                </v-icon>
                                <div>
                                    <p class="text-caption font-weight-black text-uppercase tracking-wider mb-0"
                                        :class="hasUser ? 'text-success' : 'text-warning'">
                                        {{ hasUser ? 'Cuenta de Usuario Activa' : 'Sin Cuenta de Usuario' }}
                                    </p>
                                    <p class="text-caption text-grey-darken-1 mb-0">
                                        {{ hasUser ? 'La persona ya tiene acceso al sistema.' :
                                            'La persona no podrá iniciar sesión.' }}
                                    </p>
                                </div>
                            </div>
                            <v-btn :variant="hasUser ? 'outlined' : 'flat'" :color="hasUser ? 'primary' : 'warning'"
                                rounded="lg" class="text-none px-4" size="small"
                                :loading="loadingUserCheck || loadingResetUser"
                                :disabled="loadingUserCheck || loadingResetUser"
                                @click="showConfirmUser = true">
                                {{ hasUser ? 'Reestablecer Contraseña (CI)' : 'Crear Cuenta de Usuario' }}
                            </v-btn>
                        </div>
                    </v-sheet>

                    <!-- Tarjeta Datos Personales -->
                    <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card" border>
                        <div class="section-badge primary"></div>
                        <v-card-item class="pb-1 pt-4">
                            <template v-slot:prepend>
                                <v-avatar color="primary-lighten-4" size="40">
                                    <v-icon color="primary">mdi-account-circle</v-icon>
                                </v-avatar>
                            </template>
                            <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">
                                Datos Personales
                            </v-card-title>
                            <template v-slot:append>
                                <v-btn icon="mdi-pencil" variant="tonal" size="small" color="primary" class="me-2"
                                    @click="emit('edit-personal', localUser)"></v-btn>
                            </template>
                        </v-card-item>

                        <v-card-text class="pa-4">
                            <v-row dense>
                                <v-col cols="12" sm="6" md="4">
                                    <div class="info-item">
                                        <label>ID Persona / CI</label>
                                        <p>{{ localUser.idPersona || localUser.id_persona }} / {{ localUser.ci }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="12" sm="12" md="8">
                                    <div class="info-item">
                                        <label>Nombres y Apellidos</label>
                                        <p>{{ localUser.nombres }} {{ localUser.primerApellido }} {{
                                            localUser.segundoApellido }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="12" sm="6" md="4">
                                    <div class="info-item">
                                        <label>Fecha Nacimiento</label>
                                        <p>{{ localUser.fechaNacimiento || '-' }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="12" sm="6" md="4">
                                    <div class="info-item">
                                        <label>Género / Celular</label>
                                        <p>{{ localUser.genero }} / {{ localUser.celular || '-' }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="12" sm="12" md="4">
                                    <div class="info-item">
                                        <label>Email</label>
                                        <p>{{ localUser.email }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="12">
                                    <div class="info-item">
                                        <label>Dirección</label>
                                        <p>{{ localUser.direccion || 'No registrada' }}</p>
                                    </div>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <!-- Tarjeta Datos Estudiante -->
                    <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card" border
                        :class="{ 'inactive-card': !localUser.estudiante }">
                        <div class="section-badge info"></div>
                        <v-card-item class="pb-1 pt-4">
                            <template v-slot:prepend>
                                <v-avatar :color="localUser.estudiante ? 'info-lighten-4' : 'grey-lighten-3'" size="40">
                                    <v-icon :color="localUser.estudiante ? 'info' : 'grey'">mdi-school</v-icon>
                                </v-avatar>
                            </template>
                            <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider"
                                :class="{ 'text-grey': !localUser.estudiante }">
                                Datos de Estudiante
                            </v-card-title>
                            <template v-slot:append>
                                <v-btn v-if="localUser.estudiante" icon="mdi-pencil" variant="tonal" size="small"
                                    color="info" class="me-2"
                                    @click="emit('edit-estudiante', localUser.estudiante)"></v-btn>
                                <v-btn v-else prepend-icon="mdi-plus" variant="flat" size="medium" color="info"
                                    class="font-weight-bold text-none rounded-lg btn-add-role elevation-1"
                                    @click="emit('add-estudiante', localUser)">
                                    Añadir Estudiante
                                </v-btn>
                            </template>
                        </v-card-item>

                        <v-card-text class="pa-4">
                            <v-row dense v-if="localUser.estudiante">
                                <v-col cols="6" sm="4">
                                    <div class="info-item">
                                        <label>ID / RU</label>
                                        <p>{{ localUser.estudiante.idEstudiante }} / {{
                                            localUser.estudiante.registroUniversitario }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="12" sm="8">
                                    <div class="info-item">
                                        <label>Carrera / Facultad</label>
                                        <p>{{ localUser.estudiante.carrera }} / {{ localUser.estudiante.facultad }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>Estado Académico</label>
                                        <p>{{ localUser.estudiante.estadoAcademico }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>Sincronización</label>
                                        <p>{{ fechaSincronizacionEstudiante }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <div class="info-item">
                                        <label>Documento Matrícula</label>
                                        <v-btn v-if="localUser.estudiante.documentoMatriculaUrl"
                                            :href="resolveUploadUrl(localUser.estudiante.documentoMatriculaUrl)"
                                            target="_blank" rel="noopener" variant="text" color="primary"
                                            class="pa-0 text-none h-auto" size="small" prepend-icon="mdi-file-pdf-box">
                                            Ver PDF
                                        </v-btn>
                                        <p v-else class="text-caption text-grey">No cargado</p>
                                    </div>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <div class="info-item">
                                        <label>Documento CI</label>
                                        <v-btn v-if="localUser.estudiante.documentoCarnetUrl"
                                            :href="resolveUploadUrl(localUser.estudiante.documentoCarnetUrl)"
                                            target="_blank" rel="noopener" variant="text" color="primary"
                                            class="pa-0 text-none h-auto" size="small" prepend-icon="mdi-file-pdf-box">
                                            Ver PDF
                                        </v-btn>
                                        <p v-else class="text-caption text-grey">No cargado</p>
                                    </div>
                                </v-col>
                            </v-row>
                            <div v-else class="text-center py-4 text-grey-darken-1 text-body-2 font-italic">
                                No registrado como estudiante
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- Tarjeta Datos Docente -->
                    <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card" border
                        :class="{ 'inactive-card': !localUser.docente }">
                        <div class="section-badge warning"></div>
                        <v-card-item class="pb-1 pt-4">
                            <template v-slot:prepend>
                                <v-avatar :color="localUser.docente ? 'warning-lighten-4' : 'grey-lighten-3'" size="40">
                                    <v-icon
                                        :color="localUser.docente ? 'warning' : 'grey'">mdi-human-greeting-variant</v-icon>
                                </v-avatar>
                            </template>
                            <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider"
                                :class="{ 'text-grey': !localUser.docente }">
                                Datos de Docente
                            </v-card-title>
                            <template v-slot:append>
                                <v-btn v-if="localUser.docente" icon="mdi-pencil" variant="tonal" size="small"
                                    color="warning" class="me-2"
                                    @click="emit('edit-docente', localUser.docente)"></v-btn>
                                <v-btn v-else prepend-icon="mdi-plus" variant="flat" size="medium" color="warning"
                                    class="font-weight-bold text-none rounded-lg btn-add-role elevation-1"
                                    @click="emit('add-docente', localUser)">
                                    Añadir Docente
                                </v-btn>
                            </template>
                        </v-card-item>

                        <v-card-text class="pa-4">
                            <v-row dense v-if="localUser.docente">
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>ID / Número Ítem</label>
                                        <p>{{ localUser.docente.idDocente }} / {{ localUser.docente.numeroItem }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>Facultad</label>
                                        <p>{{ localUser.docente.facultad }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>Tipo Contrato</label>
                                        <p>{{ localUser.docente.interinoContratado }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>Sincronización</label>
                                        <p>{{ localUser.docente.fechaSincronizacion || '-' }}</p>
                                    </div>
                                </v-col>
                            </v-row>
                            <div v-else class="text-center py-4 text-grey-darken-1 text-body-2 font-italic">
                                No registrado como docente
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- Tarjeta Datos Consultor -->
                    <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card" border
                        :class="{ 'inactive-card': !localUser.consultor }">
                        <div class="section-badge error"></div>
                        <v-card-item class="pb-1 pt-4">
                            <template v-slot:prepend>
                                <v-avatar :color="localUser.consultor ? 'error-lighten-4' : 'grey-lighten-3'" size="40">
                                    <v-icon
                                        :color="localUser.consultor ? 'error' : 'grey'">mdi-account-tie-outline</v-icon>
                                </v-avatar>
                            </template>
                            <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider"
                                :class="{ 'text-grey': !localUser.consultor }">
                                Datos de Consultor
                            </v-card-title>
                            <template v-slot:append>
                                <v-btn v-if="localUser.consultor" icon="mdi-plus" variant="tonal" size="small"
                                    color="error" @click="emit('add-contrato', localUser.consultor)"></v-btn>
                                <v-btn v-else prepend-icon="mdi-plus" variant="flat" size="medium" color="error"
                                    class="font-weight-bold text-none rounded-lg btn-add-role elevation-1"
                                    @click="emit('add-consultor', localUser)">
                                    Añadir Consultor
                                </v-btn>
                            </template>
                        </v-card-item>

                        <v-card-text class="pa-4">
                            <div v-if="localUser.consultor">
                                <div class="info-item mb-4">
                                    <label>ID Consultor / Sincronización</label>
                                    <p>{{ localUser.consultor.idConsultor }} / {{
                                        localUser.consultor.fechaSincronizacion || '-' }}</p>
                                </div>

                                <div
                                    class="text-caption font-weight-black text-uppercase tracking-wider text-grey mb-2">
                                    Contratos Registrados
                                </div>

                                <v-list border rounded="lg" class="pa-0">
                                    <v-list-item v-for="contrato in sortedContratos" :key="contrato.idContratoConsultor"
                                        @click="selectedContract = selectedContract?.idContratoConsultor === contrato.idContratoConsultor ? null : contrato"
                                        :class="{ 'bg-error-lighten-5': selectedContract?.idContratoConsultor === contrato.idContratoConsultor }">
                                        <v-list-item-title class="text-body-2 font-weight-bold">
                                            {{ contrato.cargo }}
                                        </v-list-item-title>
                                        <v-list-item-subtitle class="text-caption">
                                            {{ contrato.fechaInicioContrato }} - {{ contrato.fechaFinContrato }}
                                        </v-list-item-subtitle>
                                        <template v-slot:append>
                                            <v-icon size="small"
                                                :color="selectedContract?.idContratoConsultor === contrato.idContratoConsultor ? 'error' : 'grey'">
                                                {{ selectedContract?.idContratoConsultor ===
                                                    contrato.idContratoConsultor ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                            </v-icon>
                                        </template>
                                    </v-list-item>
                                </v-list>

                                <v-expand-transition>
                                    <div v-if="selectedContract"
                                        class="mt-4 pa-4 rounded-lg border-error border-dashed bg-white border">
                                        <div class="d-flex justify-space-between align-center mb-4">
                                            <div class="text-subtitle-2 font-weight-bold text-error">Detalles del
                                                Contrato</div>
                                            <div>
                                                <v-btn icon="mdi-pencil" variant="text" color="info" size="x-small"
                                                    @click="emit('edit-contrato', selectedContract)"></v-btn>
                                                <v-btn icon="mdi-delete" variant="text" color="error" size="x-small"
                                                    @click="emit('delete-contrato', selectedContract)"></v-btn>
                                            </div>
                                        </div>
                                        <v-row dense>
                                            <v-col cols="6">
                                                <div class="info-item">
                                                    <label>ID Servicio</label>
                                                    <p>{{ selectedContract.idServicio }}</p>
                                                </div>
                                            </v-col>
                                            <v-col cols="6">
                                                <div class="info-item">
                                                    <label>Unidad</label>
                                                    <p>{{ selectedContract.unidad }}</p>
                                                </div>
                                            </v-col>
                                            <v-col cols="12">
                                                <div class="info-item">
                                                    <label>Documento Contrato</label>
                                                    <v-btn v-if="selectedContract.documentoContratoUrl"
                                                        :href="selectedContract.documentoContratoUrl" target="_blank"
                                                        variant="text" color="primary" class="pa-0 text-none h-auto"
                                                        size="small" prepend-icon="mdi-file-pdf-box">
                                                        Ver Documento PDF
                                                    </v-btn>
                                                    <p v-else class="text-caption text-grey">No cargado</p>
                                                </div>
                                            </v-col>
                                        </v-row>
                                    </div>
                                </v-expand-transition>
                            </div>
                            <div v-else class="text-center py-4 text-grey-darken-1 text-body-2 font-italic">
                                No registrado como consultor
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- Tarjeta Datos Administrativo -->
                    <v-card class="mb-6 rounded-xl overflow-hidden shadow-premium premium-card" border
                        :class="{ 'inactive-card': !localUser.administrativo }">
                        <div class="section-badge success"></div>
                        <v-card-item class="pb-1 pt-4">
                            <template v-slot:prepend>
                                <v-avatar :color="localUser.administrativo ? 'success-lighten-4' : 'grey-lighten-3'"
                                    size="40">
                                    <v-icon
                                        :color="localUser.administrativo ? 'success' : 'grey'">mdi-briefcase</v-icon>
                                </v-avatar>
                            </template>
                            <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider"
                                :class="{ 'text-grey': !localUser.administrativo }">
                                Datos de Administrativo
                            </v-card-title>
                            <template v-slot:append>
                                <v-btn v-if="localUser.administrativo" icon="mdi-pencil" variant="tonal" size="small"
                                    color="success" class="me-2"
                                    @click="emit('edit-administrativo', localUser.administrativo)"></v-btn>
                                <v-btn v-else prepend-icon="mdi-plus" variant="flat" size="medium" color="success"
                                    class="font-weight-bold text-none rounded-lg btn-add-role elevation-1"
                                    @click="emit('add-administrativo', localUser)">
                                    Añadir Administrativo
                                </v-btn>
                            </template>
                        </v-card-item>

                        <v-card-text class="pa-4">
                            <v-row dense v-if="localUser.administrativo">
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>ID / Número Ítem</label>
                                        <p>{{ localUser.administrativo.idAdministrativo }} / {{
                                            localUser.administrativo.numeroItem }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>Unidad</label>
                                        <p>{{ localUser.administrativo.unidad }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>Cargo</label>
                                        <p>{{ localUser.administrativo.cargo }}</p>
                                    </div>
                                </v-col>
                                <v-col cols="6">
                                    <div class="info-item">
                                        <label>Estado Laboral</label>
                                        <p>{{ localUser.administrativo.estadoLaboral }}</p>
                                    </div>
                                </v-col>
                            </v-row>
                            <div v-else class="text-center py-4 text-grey-darken-1 text-body-2 font-italic">
                                No registrado como administrativo
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- Tarjeta Rol Actual -->
                    <v-card class="mb-20 rounded-xl overflow-hidden shadow-premium premium-card" border>
                        <v-card-item class="pb-2 pt-4">
                            <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">
                                Roles Activos en Sistema
                            </v-card-title>
                        </v-card-item>
                        <v-card-text class="pa-4">
                            <v-row dense>
                                <v-col v-for="role in visibleRoles" :key="role.idRol" cols="12" sm="12" md="12">
                                    <v-checkbox v-model="pendingRoles" :value="role.idRol" :label="role.nombre"
                                        hide-details density="compact" color="primary" class="mt-0"></v-checkbox>
                                </v-col>
                                <v-col v-if="rolesStore.loading" cols="12" class="text-center">
                                    <v-progress-circular indeterminate size="24" color="primary"></v-progress-circular>
                                </v-col>
                                <v-col v-if="!rolesStore.loading && !rolesStore.roles.length" cols="12"
                                    class="text-center py-4">
                                    <span class="text-caption text-grey">No hay roles disponibles</span>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </div>

                <!-- Fixed Footer Actions -->
                <footer class="footer-actions d-flex justify-center border-t">
                    <div class="footer-buttons-container">
                        <v-btn variant="text" color="grey-darken-1" rounded="xl"
                            class="text-none font-weight-bold action-button cancel-btn" size="large"
                            @click="emit('cancel')">
                            Cerrar Detalle
                        </v-btn>
                        <v-btn color="primary" variant="flat" rounded="xl"
                            class="text-none font-weight-bold action-button save-btn button-glow" size="large"
                            elevation="8" @click="dialogSave = true">
                            Guardar Cambios Globales
                        </v-btn>
                    </div>
                </footer>

                <!-- Global Save Confirmation -->
                <ModalConfirmación v-model="dialogSave" title="¿Guardar cambios?"
                    message="Se actualizarán todos los datos modificados en el perfil del usuario, incluyendo las nuevas asignaciones de roles."
                    type="primary" confirm-text="Guardar Cambios" @confirm="confirmSave" @cancel="dialogSave = false" />
                <!-- User Action Confirmation Dialog -->
                <ModalConfirmación v-model="showConfirmUser" :title="hasUser ? 'Reestablecer Usuario' : 'Crear Usuario'"
                    :message="`Se configurará el usuario con credenciales iguales a su C.I. (${localUser?.ci}). ¿Deseas continuar?`"
                    :type="hasUser ? 'info' : 'warning'" :confirm-text="hasUser ? 'Reestablecer' : 'Crear'"
                    :loading="loadingResetUser"
                    @confirm="toggleUser" @cancel="!loadingResetUser && (showConfirmUser = false)" />

                <!-- Status Change Confirmation -->
                <ModalConfirmación v-model="showConfirmStatus"
                    :title="pendingStatusValue ? 'Activar Cuenta' : 'Desactivar Cuenta'"
                    :message="`¿Estás seguro de que deseas ${pendingStatusValue ? 'activar' : 'desactivar'} esta cuenta?`"
                    :type="pendingStatusValue ? 'success' : 'error'"
                    :confirm-text="pendingStatusValue ? 'Activar' : 'Desactivar'" @confirm="confirmStatusChange"
                    @cancel="showConfirmStatus = false" />

                <!-- Success Message Modal -->
                <ModalMensaje v-model="showSuccessModal" :title="successTitle" :message="successMessage" type="success"
                    @confirm="showSuccessModal = false" />

                <!-- Error Message Modal -->
                <ModalMensaje v-model="showErrorModal" :title="errorTitle" :message="errorMessage" type="error"
                    @confirm="showErrorModal = false" />
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useUsuariosStore } from '@/stores/usuarios';
import { usePersonasStore } from '@/stores/personas';
import { useRolesStore } from '@/stores/roles';
import { useAsignacionRolesStore } from '@/stores/asignacion_roles';
import { useAuthStore } from '@/stores/auth';
import ModalConfirmación from '../common/ModalConfirmación.vue';
import ModalMensaje from '../common/ModalMensaje.vue';
import { resolveUploadUrl } from '@/utils/uploadUrl';
import {
    getFechaUltimaSincronizacionEstudiante,
    formatFechaEstudiante,
} from '@/utils/estudianteDocumentos';

const props = defineProps({
    user: {
        type: Object,
        default: () => null
    },
    isMobile: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits([
    'save', 'cancel',
    'edit-personal', 'delete-personal',
    'add-estudiante', 'edit-estudiante', 'delete-estudiante',
    'add-docente', 'edit-docente', 'delete-docente',
    'add-administrativo', 'edit-administrativo', 'delete-administrativo',
    'add-consultor', 'edit-consultor', 'delete-consultor',
    'add-contrato', 'edit-contrato', 'delete-contrato'
]);

const localUser = ref(null);
const dialogSave = ref(false);
const selectedContract = ref(null);
const panel = ref([1]); // Default open Access Group

const sortedContratos = ref([]);

// User Management Logic
const usuariosStore = useUsuariosStore();
const personasStore = usePersonasStore();
const rolesStore = useRolesStore();
const asignacionRolesStore = useAsignacionRolesStore();
const authStore = useAuthStore();

const hasUser = ref(false);
const loadingUserCheck = ref(false);
const loadingResetUser = ref(false);
const showConfirmUser = ref(false);

const pendingRoles = ref([]);
const initialRoles = ref([]);

const visibleRoles = computed(() => {
    return rolesStore.roles.filter(role => {
        if (role.nombre === 'SUPERUSUARIO') {
            return authStore.user?.rol === 'SUPERUSUARIO';
        }
        return true;
    });
});

const fechaSincronizacionEstudiante = computed(() => {
    const fecha = getFechaUltimaSincronizacionEstudiante(localUser.value?.estudiante);
    return formatFechaEstudiante(fecha);
});

// Status Toggle Logic
const showConfirmStatus = ref(false);
const pendingStatusValue = ref(false);

// Post-action feedback
const showSuccessModal = ref(false);
const successTitle = ref('');
const successMessage = ref('');
const errorTitle = ref('');
const errorMessage = ref('');
const showErrorModal = ref(false);

const checkUserStatus = async (idPersona) => {
    if (!idPersona) {
        hasUser.value = false;
        return;
    }
    loadingUserCheck.value = true;
    try {
        const user = await usuariosStore.fetchUserByPersona(idPersona);
        hasUser.value = !!(user && !user.deletedAt);
    } catch (error) {
        hasUser.value = false;
    } finally {
        loadingUserCheck.value = false;
    }
};

const loadUserRoles = async (idPersona) => {
    if (!idPersona) return;
    try {
        const assignments = await asignacionRolesStore.fetchAssignmentsByPersona(idPersona);
        initialRoles.value = assignments ? assignments.filter(a => a.activo).map(a => a.rol.idRol) : [];
        pendingRoles.value = [...initialRoles.value];
    } catch (error) {
        console.error('Error loading roles:', error);
    }
};

watch(() => props.user, (newVal) => {
    if (newVal) {
        localUser.value = JSON.parse(JSON.stringify(newVal));

        const idPersona = localUser.value.idPersona || localUser.value.id_persona || localUser.value.id;

        if (!localUser.value.activeRoles) {
            localUser.value.activeRoles = newVal.roles ? newVal.roles.map(r => r.name) : [];
        }

        // Initialize checkboxes based on assigned roles using the new endpoint
        loadUserRoles(idPersona);

        if (rolesStore.roles.length === 0) {
            rolesStore.fetchRoles();
        }

        // Sort contracts by start date descending
        if (localUser.value.consultor?.contratos) {
            sortedContratos.value = [...localUser.value.consultor.contratos].sort((a, b) => {
                return new Date(b.fechaInicioContrato) - new Date(a.fechaInicioContrato);
            });
        } else {
            sortedContratos.value = [];
        }
        selectedContract.value = null;
        checkUserStatus(localUser.value.idPersona || localUser.value.id_persona || localUser.value.id);
    } else {
        localUser.value = null;
        sortedContratos.value = [];
        selectedContract.value = null;
        hasUser.value = false;
    }
}, { immediate: true });

async function confirmSave() {
    dialogSave.value = false;

    const idPersona = localUser.value.idPersona || localUser.value.id_persona || localUser.value.id;

    // Detect changes
    const toActivate = pendingRoles.value.filter(id => !initialRoles.value.includes(id));
    const toDeactivate = initialRoles.value.filter(id => !pendingRoles.value.includes(id));

    if (toActivate.length === 0 && toDeactivate.length === 0) {
        emit('save', localUser.value);
        return;
    }

    try {
        // Execute all assignment updates
        const promises = [
            ...toActivate.map(idRol => asignacionRolesStore.assignRole(idPersona, idRol, true)),
            ...toDeactivate.map(idRol => asignacionRolesStore.assignRole(idPersona, idRol, false))
        ];

        await Promise.all(promises);

        successTitle.value = 'Cambios Guardados';
        successMessage.value = 'Las asignaciones de roles han sido actualizadas con éxito.';
        showSuccessModal.value = true;

        // Update initial state for next edit
        initialRoles.value = [...pendingRoles.value];

        // Emit updated to parent
        emit('save', {
            ...localUser.value,
            // We could update local activeRoles here if needed, but the parent usually refreshes
        });
    } catch (error) {
        console.error('Error saving role assignments:', error);
        errorTitle.value = 'Error al guardar cambios';
        errorMessage.value = error.message || 'Ocurrió un error al intentar actualizar las asignaciones de roles.';
        showErrorModal.value = true;
    }
}

const toggleUser = async () => {
    if (!localUser.value || loadingResetUser.value) return;

    loadingResetUser.value = true;
    const idPersona = localUser.value.idPersona || localUser.value.id_persona || localUser.value.id;
    const resetting = hasUser.value;

    try {
        await usuariosStore.createUsuario({
            idPersona: Number(idPersona),
            username: localUser.value.ci.toString(), // Asegurar que sea string
            password: localUser.value.ci.toString()  // Asegurar que sea string
        });

        showConfirmUser.value = false;

        // Set success messages
        successTitle.value = resetting ? 'Contraseña Reestablecida' : 'Usuario Creado';
        const emailHint = localUser.value.email
            ? ` Se envió un aviso a ${localUser.value.email}.`
            : '';
        successMessage.value = `Se ha ${resetting ? 'reestablecido' : 'creado'} el usuario con éxito. Las nuevas credenciales son su CI: ${localUser.value.ci}.${emailHint}`;
        showSuccessModal.value = true;

        // Refresh status after creation/reset
        checkUserStatus(idPersona);

        // Emit updated to parent to refresh table
        emit('save', localUser.value);
    } catch (error) {
        console.error('Error configuring user:', error);
        showConfirmUser.value = false;
        errorTitle.value = 'Error al configurar usuario';
        errorMessage.value = error.message || 'No se pudo crear o reestablecer el usuario. Verifique que el C.I. sea válido y tenga al menos 6 caracteres.';
        showErrorModal.value = true;
    } finally {
        loadingResetUser.value = false;
    }
};

const onToggleStatusClick = () => {
    pendingStatusValue.value = !localUser.value.activo;
    showConfirmStatus.value = true;
};

const confirmStatusChange = async () => {
    showConfirmStatus.value = false;
    const idPersona = localUser.value.idPersona || localUser.value.id_persona || localUser.value.id;
    try {
        await personasStore.updatePersonaStatus(idPersona, pendingStatusValue.value);
        localUser.value.activo = pendingStatusValue.value;

        successTitle.value = 'Estado Actualizado';
        successMessage.value = `La cuenta ha sido ${localUser.value.activo ? 'activada' : 'desactivada'} correctamente.`;
        showSuccessModal.value = true;

        // Emit updated to parent to refresh table
        emit('save', localUser.value);
    } catch (error) {
        console.error('Error updating status:', error);
    }
};
</script>

<script>
export default {
    inheritAttrs: false
}
</script>

<style scoped>
.max-width-form {
    max-width: 800px;
    width: 100%;
}

.max-width-280 {
    max-width: 280px;
}

.premium-input :deep(.v-field__outline__start) {
    border-radius: 12px 0 0 12px !important;
}

.premium-input :deep(.v-field__outline__end) {
    border-radius: 0 12px 12px 0 !important;
}

.premium-panels :deep(.v-expansion-panel-title) {
    min-height: 80px;
}

.premium-panels :deep(.v-expansion-panel-text__wrapper) {
    border-top: 1px solid #f1f5f9;
    padding: 0 !important;
}

.footer-actions {
    background-color: white;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    padding: 16px 24px !important;
    z-index: 100;
}

.footer-buttons-container {
    max-width: 800px;
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    flex-wrap: wrap;
}

.action-button {
    flex: 0 1 auto;
    min-width: 160px;
}

.section-badge {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
}

.section-badge.primary {
    background-color: rgb(var(--v-theme-primary));
}

.section-badge.info {
    background-color: rgb(var(--v-theme-info));
}

.section-badge.warning {
    background-color: rgb(var(--v-theme-warning));
}

.section-badge.success {
    background-color: rgb(var(--v-theme-success));
}

.section-badge.error {
    background-color: rgb(var(--v-theme-error));
}

.info-item {
    margin-bottom: 8px;
}

.info-item label {
    display: block;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
}

.info-item p {
    font-size: 0.95rem;
    font-weight: 600;
    color: #334155;
    margin: 0;
}

.inactive-card {
    background-color: #f1f5f9 !important;
    opacity: 0.8;
}

.inactive-card :deep(.v-card-item) {
    filter: grayscale(1);
    opacity: 0.6;
}

.inactive-card :deep(.v-card-text) {
    filter: grayscale(1);
    opacity: 0.5;
}

.user-status-card {
    border: 1px dashed #cbd5e1;
    transition: all 0.3s ease;
}

.user-status-card.no-user {
    background-color: #fff7ed;
    border-color: #ffedd5;
}

.letter-spacing-1 {
    letter-spacing: 0.1em;
}

.button-glow {
    transition: all 0.3s ease;
}

.button-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(var(--v-theme-primary), 0.4) !important;
}

.btn-add-role {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    letter-spacing: 0.02em;
}

.btn-add-role:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.25) !important;
}

.empty-state-blob {
    width: 120px;
    height: 120px;
    background: white;
    border-radius: 50% 30% 70% 40% / 40% 60% 40% 60%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05);
    animation: blob-bounce 6s infinite ease-in-out;
}

@keyframes blob-bounce {

    0%,
    100% {
        transform: translateY(0);
        border-radius: 50% 30% 70% 40% / 40% 60% 40% 60%;
    }

    50% {
        transform: translateY(-15px);
        border-radius: 30% 50% 40% 70% / 60% 40% 60% 40%;
    }
}

/* Scrollbar adjustment */
:deep(.v-card-text::-webkit-scrollbar) {
    width: 6px;
}

:deep(.v-card-text::-webkit-scrollbar-thumb) {
    background: #cbd5e1;
    border-radius: 10px;
}

@media (max-width: 600px) {
    .footer-actions {
        padding: 12px 16px !important;
    }

    .footer-buttons-container {
        justify-content: center;
        gap: 12px;
    }

    .action-button {
        flex: 1 1 140px;
        min-width: 0;
    }

    .cancel-btn {
        order: 2;
    }

    .save-btn {
        order: 1;
        width: 100%;
        flex: 1 1 100%;
    }
}
</style>
