<template>
    <div class="main-doctores-container d-flex flex-column bg-grey-lighten-5 min-vh-100">
        <div class="flex-grow-1 pa-4 pa-md-6">
            <!-- Analytics Mini-cards -->
            <v-row class="mb-6">
                <v-col cols="12" md="6">
                    <v-card border flat rounded="xl" class="pa-6 border-s-lg-primary">
                        <div class="d-flex align-center justify-space-between mb-2">
                            <span class="text-overline font-weight-black text-grey-lighten-1">Total Especialistas</span>
                            <v-icon color="primary" size="24">mdi-medical-services</v-icon>
                        </div>
                        <p class="text-h4 font-weight-black text-slate-900">{{ doctoresStore.doctores.length }}</p>
                    </v-card>
                </v-col>
                <v-col cols="12" md="6">
                    <v-card border flat rounded="xl" class="pa-6 border-s-lg-purple">
                        <div class="d-flex align-center justify-space-between mb-2">
                            <span class="text-overline font-weight-black text-grey-lighten-1">Consultorios
                                Registrados</span>
                            <v-icon color="purple" size="24">mdi-office-building-marker</v-icon>
                        </div>
                        <p class="text-h4 font-weight-black text-slate-900">{{ consultorioStore.consultorios.length }}
                        </p>
                    </v-card>
                </v-col>

            </v-row>

            <!-- Master-Detail Layout -->
            <v-row no-gutters class="flex-nowrap align-stretch ga-6">
                <!-- Left Column: Master (Table) -->
                <v-col :cols="selectedDoctor && !smAndDown ? 7 : 12" :md="selectedDoctor ? 7 : 12"
                    class="layout-transition d-flex flex-column min-height-table">

                    <div class="flex-grow-1 bg-white shadow-sm overflow-hidden rounded-xl border">
                        <TablaDoctores :loading="doctoresStore.loading" @select="onDoctorSelect"
                            @add="showModalCrear = true" />
                    </div>
                </v-col>

                <!-- Right Column: Detail (Desktop) -->
                <v-col v-if="!smAndDown && selectedDoctor" cols="5"
                    class="detail-sidebar-transition position-relative rounded-xl overflow-hidden border bg-white shadow-sm">
                    <div class="absolute-fill">
                        <DetalleDoctores :doctor="selectedDoctor" @confirm="onConfirm" @close="onCancel" />
                    </div>
                </v-col>

                <!-- Placeholder when no doctor selected on desktop -->
                <v-col v-else-if="!smAndDown" cols="5"
                    class="position-relative d-flex align-center justify-center bg-white rounded-xl border border-dashed shadow-sm opacity-60">
                    <div class="absolute-fill d-flex align-center justify-center">
                        <div class="text-center pa-8">
                            <div class="placeholder-icon-blob mb-4">
                                <v-icon size="48" color="primary">mdi-badge-account-outline</v-icon>
                            </div>
                            <p class="text-subtitle-1 font-weight-bold text-grey-darken-3">Ficha de Médico</p>
                            <p class="text-body-2 text-grey max-width-200 mx-auto">Selecciona un médico del registro
                                para gestionar su asignación de consultorio</p>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </div>

        <!-- Mobile Detail Dialog -->
        <v-dialog v-if="smAndDown" v-model="showMobileDetail" fullscreen hide-overlay
            transition="dialog-bottom-transition">
            <DetalleDoctores :doctor="selectedDoctor" @confirm="onConfirm" @close="onCancel" />
        </v-dialog>

        <!-- Modal para crear nuevo doctor -->
        <ModalInformacionAcademica v-model="showModalCrear" @saved="onDoctorSaved" />
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useDisplay } from 'vuetify';
import { useDoctoresStore } from '@/stores/doctores';
import { useConsultorioStore } from '@/stores/consultorios';
import { useAsignacionDoctoresStore } from '@/stores/asignacion_doctores_consultorio';
import TablaDoctores from '@/components/doctores/TablaDoctores.vue';
import DetalleDoctores from '@/components/doctores/DetalleDoctores.vue';
import ModalInformacionAcademica from '@/components/doctores/ModalInformacionAcademica.vue';

const doctoresStore = useDoctoresStore();
const consultorioStore = useConsultorioStore();
const asignacionStore = useAsignacionDoctoresStore();
const { smAndDown } = useDisplay();
const selectedDoctor = ref(null);
const showMobileDetail = ref(false);
const showModalCrear = ref(false);

function onDoctorSelect(doctor) {
    if (selectedDoctor.value && selectedDoctor.value.id === doctor.id) {
        selectedDoctor.value = null;
        showMobileDetail.value = false;
    } else {
        selectedDoctor.value = doctor;
        if (smAndDown.value) {
            showMobileDetail.value = true;
        }
    }
}

function onConfirm(data) {
    selectedDoctor.value = null;
    showMobileDetail.value = false;
}

function onCancel() {
    selectedDoctor.value = null;
    showMobileDetail.value = false;
}

const onDoctorSaved = async () => {
    await doctoresStore.fetchDoctores();
};

onMounted(() => {
    doctoresStore.fetchDoctores();
    consultorioStore.fetchConsultorios();
    asignacionStore.fetchAsignaciones();
});

watch(smAndDown, (isMobile) => {
    if (!isMobile && showMobileDetail.value) {
        showMobileDetail.value = false;
    }
});
</script>

<style scoped>
.main-doctores-container {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.min-vh-100 {
    min-height: 100vh;
}

.min-height-table {
    min-height: 600px;
}

.layout-transition {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-sidebar-transition {
    animation: slide-in-right 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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

.placeholder-icon-blob {
    width: 100px;
    height: 100px;
    background: #f1f5f9;
    border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
}

.max-width-200 {
    max-width: 200px;
}

.border-s-lg-primary {
    border-left: 6px solid rgb(var(--v-theme-primary)) !important;
}

.border-s-lg-purple {
    border-left: 6px solid #9c27b0 !important;
}

.border-s-lg-orange {
    border-left: 6px solid #ff9800 !important;
}

.text-emerald-darken-1 {
    color: #059669;
}

@keyframes slide-in-right {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.shadow-sm {
    box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05) !important;
}
</style>
