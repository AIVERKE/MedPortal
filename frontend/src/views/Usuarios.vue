<template>
  <div class="main-usuarios-container d-flex flex-column bg-grey-lighten-5 min-vh-100">
    <!-- Master-Detail Layout -->
    <div class="flex-grow-1 pa-4 pa-md-6">
      <v-row no-gutters class="flex-nowrap align-stretch ga-6">
        <!-- Left Column: Master (Table) -->
        <v-col cols="12" :md="selectedUser && !smAndDown ? 7 : 12"
          class="list-col d-flex flex-column min-height-table">

          <!-- Page Header (Inside Master Column) -->
          <header class="pa-6 pb-4 bg-white rounded-t-xl border-b d-flex align-center justify-space-between">
            <div>
              <h1 class="text-h4 font-weight-black text-grey-darken-4 text-h5-sm">Gestión de Usuarios</h1>
              <p class="text-body-2 text-grey-darken-1">Administra los accesos y roles de la plataforma</p>
            </div>

          </header>

          <div class="flex-grow-1 bg-white shadow-sm overflow-hidden rounded-b-xl border d-flex flex-column">
            <v-tabs v-model="tab" color="primary" class="border-b">
              <v-tab value="usuarios">
                Usuarios
                <v-chip size="x-small" class="ms-2" color="primary" variant="flat">
                  {{ personasStore.personasConUsuario.length }}
                </v-chip>
              </v-tab>
              <v-tab value="personas">
                Sin Usuario
                <v-chip size="x-small" class="ms-2" color="grey" variant="flat">
                  {{ personasStore.personasSinUsuario.length }}
                </v-chip>
              </v-tab>
            </v-tabs>

            <v-window v-model="tab" class="flex-grow-1 d-flex flex-column">
              <v-window-item value="usuarios" class="fill-height" style="min-height: 500px;">
                <UsuariosTable @select="onUserSelect" @delete="onDeleteUser" @add="onAddPersona"
                  @edit-personal="onEditPersonal" />
              </v-window-item>
              <v-window-item value="personas" class="fill-height" style="min-height: 500px;">
                <PersonasTable @select="onUserSelect" @delete="onDeleteUser" @add="onAddPersona"
                  @edit-personal="onEditPersonal" />
              </v-window-item>
            </v-window>
          </div>
        </v-col>

        <!-- Right Column: Detail (only when an item is selected) -->
        <v-col v-if="!smAndDown && selectedUser" cols="5"
          class="detail-panel position-relative rounded-xl overflow-hidden border bg-white shadow-sm">
          <div class="absolute-fill">
            <UsuarioDetail :user="selectedUser" @save="onSave" @cancel="onCancel" @edit-personal="onEditPersonal"
              @add-estudiante="onAddEstudiante" @edit-estudiante="onEditEstudiante" @add-docente="onAddDocente"
              @edit-docente="onEditDocente" @add-administrativo="onAddAdministrativo"
              @edit-administrativo="onEditAdministrativo" @add-consultor="onAddConsultor" @add-contrato="onAddContrato"
              @edit-contrato="onEditContrato" @delete-contrato="onDeleteContrato" />
            <div v-if="loadingDetail" class="detail-loading">
              <v-progress-circular indeterminate color="primary" size="40" />
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Mobile Detail Dialog -->
    <v-dialog v-if="smAndDown" v-model="showMobileDetail" fullscreen hide-overlay transition="dialog-bottom-transition"
      class="mobile-detail-dialog">
      <v-card class="bg-grey-lighten-5">
        <v-toolbar color="white" flat border density="comfortable" class="px-2">
          <v-btn icon="mdi-close" @click="showMobileDetail = false" variant="text" color="grey-darken-2"></v-btn>
          <v-toolbar-title class="font-weight-black text-grey-darken-4">
            Gestión de Usuario
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-dots-vertical" variant="text"></v-btn>
        </v-toolbar>
        <div class="flex-grow-1 overflow-hidden">
          <UsuarioDetail :user="selectedUser" is-mobile @save="onSave" @cancel="onCancel"
            @edit-personal="onEditPersonal" @add-estudiante="onAddEstudiante" @edit-estudiante="onEditEstudiante"
            @add-docente="onAddDocente" @edit-docente="onEditDocente" @add-administrativo="onAddAdministrativo"
            @edit-administrativo="onEditAdministrativo" @add-consultor="onAddConsultor" @add-contrato="onAddContrato"
            @edit-contrato="onEditContrato" @delete-contrato="onDeleteContrato" />
        </div>
      </v-card>
    </v-dialog>

    <!-- Role Modals -->
    <ModalInformacionPersonal v-model="showModalPersonal" :persona="selectedPersona" @saved="handleModalSuccess"
      @save="onSavePersona" />

    <ModalInformacionEstudiante v-model="showModalEstudiante" :persona-id="selectedUserForModal?.idPersona"
      :estudiante="selectedEstudiante" @saved="handleModalSuccess" />

    <ModalInformacionDocente v-model="showModalDocente" :persona-id="selectedUserForModal?.idPersona"
      :docente="selectedDocente" @saved="handleModalSuccess" />

    <ModalInformacionAdministrativo v-model="showModalAdministrativo" :persona-id="selectedUserForModal?.idPersona"
      :administrativo="selectedAdministrativo" @saved="handleModalSuccess" />

    <ModalInformacionConsultor v-model="showModalConsultor" :persona-id="selectedUserForModal?.idPersona"
      @saved="handleModalSuccess" />

    <ModalInformacionConsultorContrato v-model="showModalContrato"
      :consultor-id="selectedConsultorForContrato?.idConsultor" :contrato="selectedContrato"
      @saved="handleModalSuccess" />

    <!-- Feedback UI -->
    <ModalMensaje v-model="msgShow" :title="msgTitle" :message="msgContent" :type="msgType"
      @confirm="handleMsgConfirm" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { usePersonasStore } from '@/stores/personas';
import { useEstudiantesStore } from '@/stores/estudiantes';
import { useDocentesStore } from '@/stores/docentes';
import { useAdministrativosStore } from '@/stores/administrativos';
import { useConsultoresStore } from '@/stores/consultores';
import UsuariosTable from '../components/usuarios/UsuariosTable.vue';
import PersonasTable from '../components/usuarios/PersonasTable.vue';
import UsuarioDetail from '../components/usuarios/UsuarioDetail.vue';

// Modals
import ModalInformacionPersonal from '../components/doctores/ModalInformacionPersonal.vue';
import ModalInformacionEstudiante from '../components/usuarios/ModalInformacionEstudiante.vue';
import ModalInformacionDocente from '../components/usuarios/ModalInformacionDocente.vue';
import ModalInformacionAdministrativo from '../components/usuarios/ModalInformacionAdministrativo.vue';
import ModalInformacionConsultor from '../components/usuarios/ModalInformacionConsultor.vue';
import ModalInformacionConsultorContrato from '../components/usuarios/ModalInformacionConsultorContrato.vue';
import ModalMensaje from '../components/common/ModalMensaje.vue';
import { onMounted } from 'vue';

const { smAndDown } = useDisplay();
const personasStore = usePersonasStore();
const estudiantesStore = useEstudiantesStore();
const docentesStore = useDocentesStore();
const administrativosStore = useAdministrativosStore();
const consultoresStore = useConsultoresStore();
const selectedUser = ref(null);
const showMobileDetail = ref(false);
const tab = ref('usuarios');
const loading = ref(false);
const loadingDetail = ref(false);

const personaId = (user) => {
  if (!user) return null;
  const id = user.idPersona ?? user.id_persona ?? null;
  return id == null ? null : String(id);
};

// Feedback refs (Shared)
const msgShow = ref(false);
const msgTitle = ref('');
const msgContent = ref('');
const msgType = ref('success');

// Modal Visibility Refs
const showModalPersonal = ref(false);
const showModalEstudiante = ref(false);
const showModalDocente = ref(false);
const showModalAdministrativo = ref(false);
const showModalConsultor = ref(false);
const showModalContrato = ref(false);

// Modal Data Refs
const selectedPersona = ref(null);
const selectedUserForModal = ref(null);
const selectedEstudiante = ref(null);
const selectedDocente = ref(null);
const selectedAdministrativo = ref(null);
const selectedConsultor = ref(null);
const selectedConsultorForContrato = ref(null);
const selectedContrato = ref(null);

async function fetchFullUserData(idPersona) {
  try {
    // Fetch full persona details (including base fields)
    const fullPersona = await personasStore.fetchPersonaById(idPersona);

    // Fetch role-specific data in parallel, but handle 404s individually
    const [estudiante, docente, administrativo, consultor, contratos] = await Promise.all([
      estudiantesStore.fetchByPersona(idPersona).catch(() => null),
      docentesStore.fetchByPersona(idPersona).catch(() => null),
      administrativosStore.fetchByPersona(idPersona).catch(() => null),
      consultoresStore.fetchByPersona(idPersona).catch(() => null),
      consultoresStore.fetchContratosByPersona(idPersona).catch(() => [])
    ]);

    // Merge all data into a single object for the detail view
    return {
      ...fullPersona,
      estudiante,
      docente,
      administrativo,
      consultor: consultor ? { ...consultor, contratos } : null
    };
  } catch (error) {
    console.error('Error fetching full user data:', error);
    throw error;
  }
}

async function onUserSelect(user) {
  const nextId = personaId(user);
  const currentId = personaId(selectedUser.value);

  if (currentId && nextId && currentId === nextId) {
    selectedUser.value = null;
    showMobileDetail.value = false;
    return;
  }

  const idPersona = nextId || user.id;
  if (!idPersona) return;

  loadingDetail.value = true;
  try {
    selectedUser.value = await fetchFullUserData(idPersona);
    if (smAndDown.value) {
      showMobileDetail.value = true;
    }
  } catch (error) {
    msgTitle.value = 'Error';
    msgContent.value = 'No se pudo cargar la información completa del usuario.';
    msgType.value = 'error';
    msgShow.value = true;
  } finally {
    loadingDetail.value = false;
  }
}

async function onDeleteUser(user) {
  const id = user.idPersona || user.id_persona || user.id;
  if (!id) return;

  try {
    await personasStore.deletePersona(id);
    const selectedId = selectedUser.value?.idPersona ?? selectedUser.value?.id_persona ?? selectedUser.value?.id;
    if (selectedUser.value && String(selectedId) === String(id)) {
      selectedUser.value = null;
      showMobileDetail.value = false;
    }
    msgTitle.value = 'Éxito';
    msgContent.value = 'Persona eliminada correctamente (borrado lógico).';
    msgType.value = 'success';
    msgShow.value = true;
  } catch (error) {
    msgTitle.value = 'Error';
    msgContent.value = error.message || 'No se pudo eliminar a la persona.';
    msgType.value = 'error';
    msgShow.value = true;
  }
}

function onSave(userData) {
  handleModalSuccess();
  if (smAndDown.value) {
    showMobileDetail.value = false;
  }
}

function onCancel() {
  selectedUser.value = null;
  if (smAndDown.value) {
    showMobileDetail.value = false;
  }
}

// Handlers for Personal Info
function onAddPersona() {
  selectedPersona.value = null;
  showModalPersonal.value = true;
}

function onEditPersonal(user) {
  selectedPersona.value = user;
  showModalPersonal.value = true;
}

async function onSavePersona(personaData, photoFile = null) {
  loading.value = true;
  try {
    const res = await personasStore.createPersona(personaData);
    const idPersona = res?.idPersona || res?.id_persona || res?.id;
    if (idPersona && photoFile) {
      await personasStore.updatePersonaFoto(idPersona, photoFile);
    }
    showModalPersonal.value = false;
    msgTitle.value = 'Éxito';
    msgContent.value = 'Persona creada correctamente.';
    msgType.value = 'success';
    msgShow.value = true;
    handleModalSuccess();
  } catch (error) {
    msgTitle.value = 'Error';
    msgContent.value = error.message || 'No se pudo crear a la persona.';
    msgType.value = 'error';
    msgShow.value = true;
  } finally {
    loading.value = false;
  }
}

// Handlers for Student
function onAddEstudiante(user) {
  selectedUserForModal.value = user;
  selectedEstudiante.value = null;
  showModalEstudiante.value = true;
}

function onEditEstudiante(estudiante) {
  selectedUserForModal.value = selectedUser.value;
  selectedEstudiante.value = estudiante;
  showModalEstudiante.value = true;
}

// Handlers for Teacher
function onAddDocente(user) {
  selectedUserForModal.value = user;
  selectedDocente.value = null;
  showModalDocente.value = true;
}

function onEditDocente(docente) {
  selectedUserForModal.value = selectedUser.value;
  selectedDocente.value = docente;
  showModalDocente.value = true;
}

// Handlers for Administrative
function onAddAdministrativo(user) {
  selectedUserForModal.value = user;
  selectedAdministrativo.value = null;
  showModalAdministrativo.value = true;
}

function onEditAdministrativo(administrativo) {
  selectedUserForModal.value = selectedUser.value;
  selectedAdministrativo.value = administrativo;
  showModalAdministrativo.value = true;
}

// Handlers for Consultant
function onAddConsultor(user) {
  selectedUserForModal.value = user;
  selectedConsultor.value = null;
  showModalConsultor.value = true;
}

function onEditConsultor(consultor) {
  selectedUserForModal.value = selectedUser.value;
  selectedConsultor.value = consultor;
  showModalConsultor.value = true;
}

// Handlers for Consultant Contracts
function onAddContrato(consultor) {
  selectedConsultorForContrato.value = consultor;
  selectedContrato.value = null;
  showModalContrato.value = true;
}

function onEditContrato(contrato) {
  selectedConsultorForContrato.value = selectedUser.value.consultor;
  selectedContrato.value = contrato;
  showModalContrato.value = true;
}

async function onDeleteContrato(contrato) {
  try {
    await consultoresStore.deleteContrato(contrato.idContratoConsultor);
    msgTitle.value = 'Éxito';
    msgContent.value = 'Contrato eliminado correctamente.';
    msgType.value = 'success';
    msgShow.value = true;
    handleModalSuccess();
  } catch (error) {
    msgTitle.value = 'Error';
    msgContent.value = error.message || 'No se pudo eliminar el contrato.';
    msgType.value = 'error';
    msgShow.value = true;
  }
}

async function handleModalSuccess() {
  // Refresh the selected user's data to reflect changes in the detail view
  if (selectedUser.value) {
    const id = selectedUser.value.idPersona || selectedUser.value.id_persona || selectedUser.value.id;
    if (id) {
      try {
        selectedUser.value = await fetchFullUserData(id);
      } catch (error) {
        console.error('Error refreshing user data after modal:', error);
      }
    }
  }
  // Also refresh the main table
  await Promise.all([
    personasStore.fetchPersonasSinUsuario(),
    personasStore.fetchPersonasConUsuario()
  ]);
}

const handleMsgConfirm = () => {
  msgShow.value = false;
};

watch(smAndDown, (isMobile) => {
  if (!isMobile && showMobileDetail.value) {
    showMobileDetail.value = false;
  }
});

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    personasStore.fetchPersonasSinUsuario(),
    personasStore.fetchPersonasConUsuario()
  ]);
  loading.value = false;
});
</script>

<style scoped>
.main-usuarios-container {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.min-vh-100 {
  min-height: 100vh;
}

.min-height-table {
  min-height: 600px;
}

.list-col {
  transition: flex-basis 0.25s ease, max-width 0.25s ease;
}

.detail-panel {
  min-height: 600px;
  animation: detail-enter 0.22s ease;
}

.position-relative {
  position: relative;
}

.absolute-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: hidden;
}

.detail-loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.72);
}

@keyframes detail-enter {
  from {
    opacity: 0;
    transform: translateX(12px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.shadow-sm {
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05) !important;
}

.mobile-detail-dialog :deep(.v-overlay__content) {
  background: #f8fafc !important;
}

:deep(.v-dialog .v-card) {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
