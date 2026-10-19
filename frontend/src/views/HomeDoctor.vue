<template>
    <div class="max-width-form mx-auto pb-8 home-doctor-page">
        <!-- Header Section -->
        <header class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6 mb-md-8" data-tour="doctor-home-welcome">
            <div class="min-width-0">
                <h3 class="text-h5 text-md-h4 font-weight-black text-grey-darken-4 tracking-tight text-wrap">
                    Cuadro de Mando del Doctor
                </h3>
                <p class="text-subtitle-2 font-weight-medium text-grey-darken-1 text-wrap">
                    {{ doctorName }} <span class="mx-2 opacity-30">|</span> {{ especialidadName }}
                </p>
            </div>
            <v-row dense class="ma-0 flex-grow-0" style="width: 100%; max-width: 100%;">
                <!-- <v-col cols="6" sm="auto">
                    <v-btn color="deep-purple-lighten-1" :size="$vuetify.display.xs ? 'default' : 'large'" rounded="lg"
                        elevation="2" prepend-icon="mdi-brain" block class="text-none font-weight-bold btn-header-main"
                        @click="$router.push('/doctor/historial-medico?type=psicologia')">
                        Historial Psicología
                    </v-btn>
                </v-col>
                <v-col cols="6" sm="auto">
                    <v-btn color="secondary" :size="$vuetify.display.xs ? 'default' : 'large'" rounded="lg"
                        elevation="2" prepend-icon="mdi-history" block
                        class="text-none font-weight-bold btn-header-main"
                        @click="$router.push('/doctor/historial-medico')">
                        Historial Médico
                    </v-btn>
                </v-col> -->
                <v-col cols="6" sm="auto">
                    <v-btn color="success" :size="$vuetify.display.xs ? 'default' : 'large'" rounded="lg" variant="flat"
                        prepend-icon="mdi-account-plus" block class="text-none font-weight-bold btn-header-main"
                        data-tour="doctor-home-atender"
                        @click="openAtenderSinReservaModal">
                        Atender sin reserva
                    </v-btn>
                </v-col>
                <v-col cols="6" sm="auto">
                    <v-btn color="error" :size="$vuetify.display.xs ? 'default' : 'large'" rounded="lg" variant="flat"
                        prepend-icon="mdi-alert-circle" block class="text-none font-weight-bold btn-header-main"
                        data-tour="doctor-home-emergencia"
                        @click="openEmergencyModal">
                        Atender Emergencia
                    </v-btn>
                </v-col>
            </v-row>
        </header>

        <!-- Navigation Header Full Width -->
        <v-card class="rounded-xl mb-4 mb-md-6 overflow-hidden shadow-premium premium-card position-relative" border>
            <div class="section-badge primary"></div>
            <v-card-text class="pa-3 pa-md-6">
            <div class="d-flex flex-wrap align-center justify-space-between mb-4 mb-md-6 ga-2">
                <div class="d-flex align-center ga-1 ga-md-2 min-width-0 flex-grow-1">
                    <v-btn icon="mdi-chevron-left" variant="tonal" size="small" rounded="lg"
                        @click="moveWeek(-1)"></v-btn>
                    <h2 class="text-subtitle-1 font-weight-black text-uppercase tracking-wider mx-1 text-truncate calendar-week-title text-grey-darken-3">
                        {{ currentMonthName }} <span class="text-grey-darken-1">{{ currentYear }}</span>
                    </h2>
                    <v-btn icon="mdi-chevron-right" variant="tonal" size="small" rounded="lg"
                        @click="moveWeek(1)"></v-btn>
                </div>
                <v-btn variant="tonal" size="small" color="primary" rounded="lg" class="text-none font-weight-bold flex-shrink-0"
                    @click="goToToday">
                    Ir a hoy
                </v-btn>
            </div>

            <div class="calendar-grid" data-tour="doctor-home-semana">
                <div v-for="day in weekDays" :key="day.dateStr"
                    class="calendar-day-item d-flex flex-column align-center cursor-pointer py-2 py-md-3 rounded-lg rounded-md-xl transition-all"
                    :class="{ 'active-day': day.dateStr === selectedDateStr, 'is-today': day.dateStr === todayDateStr }"
                    @click="selectDate(day.date)">
                    <span class="text-xxs font-weight-bold text-uppercase mb-1 calendar-day-name"
                        :class="day.dateStr === selectedDateStr ? 'text-white' : 'text-disabled'">
                        <span class="d-md-none">{{ day.dayNameShort }}</span>
                        <span class="d-none d-md-inline">{{ day.dayName }}</span>
                    </span>
                    <span class="text-body-1 text-md-h6 font-weight-black calendar-day-num"
                        :class="day.dateStr === selectedDateStr ? 'text-white' : 'text-grey-darken-4'">
                        {{ day.dayNum }}
                    </span>

                    <!-- Appointment Count Badge -->
                    <div v-if="getCountForDate(day.dateStr) > 0" class="date-count mt-1"
                        :class="day.dateStr === selectedDateStr ? 'bg-white text-primary' : 'bg-primary-lighten-5 text-primary'">
                        <span class="d-none d-sm-inline">{{ getCountForDate(day.dateStr) }} reservas</span>
                        <span class="d-sm-none">{{ getCountForDate(day.dateStr) }}</span>
                    </div>

                    <div class="dot-container mt-1">
                        <div v-if="day.dateStr === todayDateStr" class="today-dot"
                            :class="{ 'dot-active': day.dateStr === selectedDateStr }"></div>
                    </div>
                </div>
            </div>
            </v-card-text>
        </v-card>

        <v-row class="ma-0 align-stretch">
            <!-- Left Panel: Paciente Activo -->
            <v-col cols="12" lg="8" class="px-0 pe-lg-4 d-flex mb-6 mb-lg-0">

                <v-card v-if="activeReserva" class="rounded-xl overflow-hidden flex-grow-1 d-flex flex-column shadow-premium premium-card position-relative" border>
                    <div class="section-badge primary"></div>
                    <div class="flex-grow-1 d-flex flex-column w-100" style="min-width: 0;">
                            <v-card-title
                                class="d-flex flex-wrap justify-space-between align-center px-4 px-md-6 py-4 border-b ga-2">
                                <div class="d-flex flex-wrap align-center ga-2 ga-md-3">
                                    <v-chip color="primary" size="small" class="font-weight-bold text-uppercase" label variant="tonal">
                                        Paciente Actual
                                    </v-chip>
                                    <span class="text-caption text-grey-darken-1 font-weight-bold">
                                        ID Cita: #{{ activeReserva.rawId || activeReserva.id }}
                                    </span>
                                </div>
                                <v-chip :color="activeReserva.estado === 'PENDIENTE' ? 'warning' : 'success'"
                                    size="small" class="font-weight-bold text-uppercase" variant="tonal">
                                    {{ activeReserva.estado }}
                                </v-chip>
                            </v-card-title>

                            <v-card-text class="pa-4 pa-md-6">
                                <!-- Patient Info Row -->
                                <div
                                    class="d-flex flex-column flex-md-row gap-5 gap-md-8 align-center align-md-start mb-6 mb-md-8 text-center text-md-left">
                                    <PersonaAvatar
                                        :foto="activeReserva.paciente?.foto"
                                        :nombres="activeReserva.paciente?.nombres || activeReserva.paciente?.nombre"
                                        :primer-apellido="activeReserva.paciente?.primerApellido"
                                        :size="100"
                                        rounded="lg"
                                        class="elevation-2 border d-md-none"
                                        style="flex-shrink: 0;"
                                    />
                                    <PersonaAvatar
                                        :foto="activeReserva.paciente?.foto"
                                        :nombres="activeReserva.paciente?.nombres || activeReserva.paciente?.nombre"
                                        :primer-apellido="activeReserva.paciente?.primerApellido"
                                        :size="120"
                                        rounded="lg"
                                        class="elevation-2 border d-none d-md-block"
                                        style="flex-shrink: 0;"
                                    />

                                    <div class="flex-grow-1 w-100 ms-md-2" style="min-width: 0;">
                                        <PacienteTipoChips
                                            :roles="activeReserva.paciente?.roles"
                                            wrapper-class="mb-2"
                                        />
                                        <h2 class="text-h6 text-md-h4 font-weight-black text-grey-darken-4 mb-1 text-wrap"
                                            style="display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;">
                                            {{ activeReserva.paciente?.nombre || 'Paciente Sin Nombre' }}
                                        </h2>
                                        <div
                                            class="d-flex align-center justify-center justify-md-start ga-2 text-grey-darken-1 mb-4">
                                            <v-icon size="small">mdi-medical-bag</v-icon>
                                            <span class="text-body-2 text-md-body-1 font-weight-medium">
                                                {{ activeReserva.especialidad?.nombre || 'Consulta General' }}
                                            </span>
                                        </div>

                                        <div
                                            class="d-flex flex-column flex-sm-row justify-center justify-md-start gap-4">
                                            <v-sheet
                                                v-if="activeReserva.estado !== 'A-SIN-RESERVA'"
                                                border
                                                rounded="lg"
                                                class="pa-3 d-flex align-center gap-3 bg-surface-light w-100 w-sm-auto"
                                            >
                                                <v-avatar color="blue-lighten-5" size="40" rounded="lg">
                                                    <v-icon color="primary">mdi-calendar-clock</v-icon>
                                                </v-avatar>
                                                <div class="text-left flex-grow-1">
                                                    <p class="text-caption text-uppercase font-weight-bold text-disabled mb-0"
                                                        style="line-height: 1;">Cita</p>
                                                    <p class="text-body-1 font-weight-bold mb-0">
                                                        {{ formatTime(activeReserva.horaInicioCita) }}
                                                        <span class="text-medium-emphasis mx-1">·</span>
                                                        {{ activeReserva.fechaCita }}
                                                    </p>
                                                </div>
                                            </v-sheet>

                                            <v-sheet
                                                v-if="activeReserva.estado === 'A-SIN-RESERVA'"
                                                border
                                                rounded="lg"
                                                class="pa-3 d-flex align-center gap-3 bg-error-lighten-5 w-100 w-sm-auto"
                                            >
                                                <v-avatar color="error" size="40" rounded="lg">
                                                    <v-icon color="white">mdi-run-fast</v-icon>
                                                </v-avatar>
                                                <div class="text-left flex-grow-1">
                                                    <p class="text-caption text-uppercase font-weight-bold text-error mb-0"
                                                        style="line-height: 1;">Horario Atención</p>
                                                    <p class="text-body-1 font-weight-bold text-error mb-0">
                                                        {{ formatTime(activeReserva.horaAtendido) }}
                                                        <template v-if="activeReserva.horaFinCita">
                                                            - {{ formatTime(activeReserva.horaFinCita) }}
                                                        </template>
                                                    </p>
                                                </div>
                                            </v-sheet>
                                        </div>
                                    </div>

                                    <div class="d-flex flex-column ga-3 w-100 w-md-auto mt-4 mt-md-0 patient-actions">
                                        <v-btn
                                            :color="['PRESENTE', 'ATENDIDO', 'A-SIN-RESERVA', 'A-FUERA-HORARIO'].includes(activeReserva.estado) ? 'grey-darken-1' : (isReservaAtrasada(activeReserva) ? 'error' : 'primary')"
                                            size="large" rounded="lg" variant="flat"
                                            :prepend-icon="['PRESENTE', 'ATENDIDO', 'A-SIN-RESERVA', 'A-FUERA-HORARIO'].includes(activeReserva.estado) ? 'mdi-check-all' : (isReservaAtrasada(activeReserva) ? 'mdi-clock-alert' : 'mdi-play')"
                                            class="text-none font-weight-bold px-4 px-md-8 w-100"
                                            @click="['PRESENTE', 'ATENDIDO', 'A-SIN-RESERVA', 'A-FUERA-HORARIO'].includes(activeReserva.estado) ? null : atenderPaciente()"
                                            :loading="isAtendiendo"
                                            :disabled="['PRESENTE', 'ATENDIDO', 'A-SIN-RESERVA', 'A-FUERA-HORARIO'].includes(activeReserva.estado)">
                                            {{ ['ATENDIDO', 'A-FUERA-HORARIO'].includes(activeReserva.estado) ?
                                                'Atendido' :
                                                activeReserva.estado === 'A-SIN-RESERVA' ? 'A. Sin Reserva' :
                                                    activeReserva.estado === 'PRESENTE' ? 'En Consulta' :
                                                        (isReservaAtrasada(activeReserva) ? 'Atender fuera de horario' : 'Atender') }}
                                        </v-btn>
                                        <PacienteDocumentosMenu
                                            v-if="activeReserva.paciente && (activeReserva.paciente.esEstudiante || activeReserva.paciente.esConsultor)"
                                            :paciente="activeReserva.paciente"
                                        />
                                        <v-btn
                                            v-if="activeReserva.paciente"
                                            color="secondary"
                                            variant="tonal"
                                            size="large"
                                            rounded="lg"
                                            prepend-icon="mdi-calendar-plus"
                                            class="text-none font-weight-bold w-100"
                                            @click="agendarCitaParaPaciente(activeReserva.paciente)"
                                        >
                                            Agendar nueva cita
                                        </v-btn>
                                    </div>
                                </div>

                                <v-divider class="mb-6"></v-divider>

                                <!-- Observations -->
                                <div>
                                    <div class="d-flex align-center justify-center justify-md-start ga-3 mb-3">
                                        <v-icon color="indigo" size="small">mdi-text-box-search-outline</v-icon>
                                        <h3 class="text-caption font-weight-bold text-uppercase text-indigo"
                                            style="letter-spacing: 1px;">
                                            Motivo de Consulta
                                        </h3>
                                    </div>
                                    <v-sheet color="indigo-lighten-5" border="indigo-lighten-4" rounded="xl"
                                        class="pa-4 pa-md-5 text-center text-md-left">
                                        <p class="text-body-2 text-md-body-1 font-weight-medium font-italic mb-0 text-indigo-darken-4"
                                            style="line-height: 1.6;">
                                            {{ activeReserva.observaciones
                                                || 'No hay observaciones adicionales para esta cita.' }}
                                        </p>
                                    </v-sheet>
                                </div>
                            </v-card-text>
                        </div>
                </v-card>

                <!-- Emergency Detail View -->
                <v-card v-else-if="selectedEmergency" class="rounded-xl overflow-hidden flex-grow-1 d-flex flex-column shadow-premium premium-card position-relative" border>
                    <div class="section-badge" style="background-color: rgb(var(--v-theme-error));"></div>
                    <div class="flex-grow-1 d-flex flex-column w-100" style="min-width: 0;">
                            <v-card-title
                                class="d-flex flex-wrap justify-space-between align-center px-4 px-md-6 py-4 border-b ga-2">
                                <div class="d-flex flex-wrap align-center ga-2 ga-md-3">
                                    <v-chip color="error" size="small" class="font-weight-bold text-uppercase" label variant="tonal">
                                        EMERGENCIA REGISTRADA
                                    </v-chip>
                                    <span class="text-caption text-error font-weight-bold">
                                        ID: #EM-{{ selectedEmergency.idEmergencia }}
                                    </span>
                                </div>
                                <v-chip color="error" variant="tonal" size="small"
                                    class="font-weight-black text-uppercase">
                                    ATENCIÓN INMEDIATA
                                </v-chip>
                            </v-card-title>

                            <v-card-text class="pa-4 pa-md-6">
                                <!-- Patient Info Row -->
                                <div
                                    class="d-flex flex-column flex-md-row gap-5 gap-md-8 align-center align-md-start mb-6 mb-md-8 text-center text-md-left">
                                    <v-avatar size="100" color="red-lighten-4" class="elevation-2 border rounded-xl"
                                        style="flex-shrink: 0;">
                                        <v-icon size="48" color="error">mdi-alert-circle-outline</v-icon>
                                    </v-avatar>

                                    <div class="flex-grow-1 w-100 ms-md-2" style="min-width: 0;">
                                        <h2 class="text-h6 text-md-h4 font-weight-black text-error mb-1 text-wrap">
                                            {{ selectedEmergency.nombrePaciente }}
                                        </h2>
                                        <div
                                            class="d-flex align-center justify-center justify-md-start gap-2 text-medium-emphasis mb-4">
                                            <v-icon size="small" color="error">mdi-hospital-marker</v-icon>
                                            <span class="text-body-2 text-md-body-1 font-weight-bold text-error">
                                                CASO DE EMERGENCIA
                                            </span>
                                        </div>

                                        <div
                                            class="d-flex flex-column flex-sm-row justify-center justify-md-start gap-3">
                                            <v-sheet border rounded="lg"
                                                class="pa-3 d-flex align-center gap-3 bg-surface-light w-100 w-sm-auto">
                                                <v-avatar color="white" size="40" rounded="lg">
                                                    <v-icon color="error">mdi-clock-check</v-icon>
                                                </v-avatar>
                                                <div class="text-left flex-grow-1">
                                                    <p class="text-caption text-uppercase font-weight-bold text-error opacity-70 mb-0"
                                                        style="line-height: 1;">Inicio</p>
                                                    <p class="text-body-1 font-weight-black text-error mb-0">{{
                                                        selectedEmergency.horaInicio }}</p>
                                                </div>
                                            </v-sheet>

                                            <v-sheet border rounded="lg"
                                                class="pa-3 d-flex align-center gap-3 bg-surface-light w-100 w-sm-auto">
                                                <v-avatar color="white" size="40" rounded="lg">
                                                    <v-icon color="error">mdi-clock-end</v-icon>
                                                </v-avatar>
                                                <div class="text-left flex-grow-1">
                                                    <p class="text-caption text-uppercase font-weight-bold text-error opacity-70 mb-0"
                                                        style="line-height: 1;">Fin</p>
                                                    <p class="text-body-1 font-weight-black text-error mb-0">{{
                                                        selectedEmergency.horaFin || 'No registrada' }}</p>
                                                </div>
                                            </v-sheet>
                                        </div>
                                    </div>
                                </div>

                                <v-divider class="mb-6"></v-divider>

                                <!-- Case Description -->
                                <div>
                                    <div class="d-flex align-center justify-center justify-md-start ga-3 mb-3">
                                        <v-icon color="error" size="small">mdi-text-box-search-outline</v-icon>
                                        <h3 class="text-caption font-weight-bold text-uppercase text-error"
                                            style="letter-spacing: 1px;">
                                            Descripción del Caso
                                        </h3>
                                    </div>
                                    <v-sheet border rounded="xl"
                                        class="pa-4 pa-md-5 text-center text-md-left bg-surface-light">
                                        <p class="text-body-1 font-weight-bold mb-0 text-black"
                                            style="line-height: 1.6;">
                                            {{ selectedEmergency.descripcionCaso || 'Sin descripción detallada.' }}
                                        </p>
                                    </v-sheet>
                                </div>
                            </v-card-text>
                        </div>
                </v-card>

                <!-- Empty State -->
                <v-card v-else class="rounded-xl d-flex flex-column align-center justify-center pa-12 text-center flex-grow-1 overflow-hidden shadow-premium premium-card position-relative"
                    border min-height="400">
                    <div class="section-badge primary"></div>
                    <v-icon size="100" color="disabled" class="opacity-20 mb-4">mdi-account-clock-outline</v-icon>
                    <h3 class="text-h5 font-weight-bold text-grey-darken-1 mb-2">No hay citas activas</h3>
                    <p class="text-body-1 text-grey-lighten-1 max-width-400">
                        Selecciona un paciente de la cola para comenzar la atención médica.
                    </p>
                </v-card>
            </v-col>

            <!-- Right Panel: Cola de Espera -->
            <v-col cols="12" lg="4" class="px-0 ps-lg-4 d-flex">
                <v-card class="rounded-xl flex-grow-1 d-flex flex-column overflow-hidden shadow-premium premium-card position-relative" border>
                    <div class="section-badge success"></div>
                    <v-card-item class="pb-1 pt-4">
                        <template #prepend>
                            <v-avatar color="success-lighten-4" size="40">
                                <v-icon color="success">mdi-account-group</v-icon>
                            </v-avatar>
                        </template>
                        <v-card-title class="text-subtitle-1 font-weight-black text-uppercase tracking-wider">
                            Pacientes
                        </v-card-title>
                        <template #append>
                            <div class="d-flex align-center ga-2">
                                <v-chip color="primary" size="x-small" class="font-weight-black" variant="tonal">
                                    {{ doctorReservas.length }}
                                </v-chip>
                                <v-btn icon="mdi-refresh" variant="tonal" size="small" rounded="lg" @click="fetchDoctorData"
                                    :loading="reservasStore.loading"></v-btn>
                            </div>
                        </template>
                    </v-card-item>

                    <v-divider></v-divider>

                    <v-card-text class="pa-0 flex-grow-1 overflow-y-auto queue-container">
                        <!-- 1. Citas Concluidas (Gris) -->
                        <div v-if="concluidasQueue.length > 0" class="bg-grey-lighten-4 px-4 px-md-6 py-4 border-b">
                            <h3 class="text-caption font-weight-bold text-grey-darken-2 text-uppercase mb-4"
                                style="letter-spacing: 1px;">
                                Citas Concluidas
                            </h3>
                            <v-list class="py-0 bg-transparent">
                                <DoctorColaPacienteItem
                                    v-for="res in concluidasQueue"
                                    :key="res.id"
                                    :res="res"
                                    :selected="activeReserva?.id === res.id"
                                    avatar-color="grey-lighten-2"
                                    avatar-text-class="text-grey-darken-3"
                                    :get-initials="getInitials"
                                    @click="setActivePatient(res)"
                                >
                                    <template #subtitle>
                                        <div class="d-flex align-center gap-2">
                                            <v-icon size="12" color="grey-darken-2">mdi-clock-outline</v-icon>
                                            <span class="text-caption font-weight-medium text-grey-darken-2">
                                                {{ formatTime(res.horaInicioCita) }}
                                            </span>
                                        </div>
                                    </template>
                                </DoctorColaPacienteItem>
                            </v-list>
                        </div>

                        <!-- 2. Citas Atrasadas (Rojo) -->
                        <div v-if="atrasadasQueue.length > 0" class="bg-red-lighten-5 px-4 px-md-6 py-4 border-b">
                            <h3 class="text-caption font-weight-bold text-red-darken-3 text-uppercase mb-4"
                                style="letter-spacing: 1px;">
                                Citas Atrasadas
                            </h3>
                            <v-list class="py-0 bg-transparent">
                                <DoctorColaPacienteItem
                                    v-for="res in atrasadasQueue"
                                    :key="res.id"
                                    :res="res"
                                    :selected="activeReserva?.id === res.id"
                                    avatar-color="red-lighten-4"
                                    avatar-text-class="text-red-darken-4"
                                    item-class="border-error-left"
                                    :get-initials="getInitials"
                                    @click="setActivePatient(res)"
                                >
                                    <template #subtitle>
                                        <div class="d-flex align-center gap-2">
                                            <v-icon size="12" color="error">mdi-clock-alert</v-icon>
                                            <span class="text-caption font-weight-medium text-error">
                                                {{ formatTime(res.horaInicioCita) }}
                                            </span>
                                            <v-chip color="error" size="x-small" variant="flat"
                                                class="ms-3 text-xxs font-weight-black">ATRASO</v-chip>
                                        </div>
                                    </template>
                                </DoctorColaPacienteItem>
                            </v-list>
                        </div>

                        <!-- 3. Cita Actual (Verde) -->
                        <div v-if="actualReservaItem" class="bg-green-lighten-5 px-4 px-md-6 py-4 border-b">
                            <h3 class="text-caption font-weight-bold text-green-darken-3 text-uppercase mb-4"
                                style="letter-spacing: 1px;">
                                Cita Siguiente
                            </h3>
                            <v-list class="py-0 bg-transparent">
                                <DoctorColaPacienteItem
                                    :res="actualReservaItem"
                                    :selected="activeReserva?.id === actualReservaItem.id"
                                    avatar-color="green-lighten-4"
                                    avatar-text-class="text-green-darken-4"
                                    item-class="border-success-left"
                                    :get-initials="getInitials"
                                    @click="setActivePatient(actualReservaItem)"
                                >
                                    <template #subtitle>
                                        <div class="d-flex align-center gap-2">
                                            <v-icon size="12"
                                                :color="isReservaAtrasada(actualReservaItem) ? 'error' : 'green-darken-2'">
                                                {{ isReservaAtrasada(actualReservaItem) ? 'mdi-clock-alert' :
                                                    'mdi-clock-outline' }}
                                            </v-icon>
                                            <span class="text-caption font-weight-medium"
                                                :class="isReservaAtrasada(actualReservaItem) ? 'text-error' : 'text-green-darken-2'">
                                                {{ formatTime(actualReservaItem.horaInicioCita) }}
                                            </span>
                                            <v-chip v-if="isReservaAtrasada(actualReservaItem)" color="error" size="x-small"
                                                variant="flat" class="ms-3 text-xxs font-weight-black">ATRASO</v-chip>
                                        </div>
                                    </template>
                                </DoctorColaPacienteItem>
                            </v-list>
                        </div>

                        <!-- 4. Próximas Citas (Azul) -->
                        <div v-if="proximasQueue.length > 0" class="bg-blue-lighten-5 px-4 px-md-6 py-4 border-b">
                            <h3 class="text-caption font-weight-bold text-blue-darken-3 text-uppercase mb-4"
                                style="letter-spacing: 1px;">
                                Próximas Citas
                            </h3>
                            <v-list class="py-0 bg-transparent">
                                <DoctorColaPacienteItem
                                    v-for="res in proximasQueue"
                                    :key="res.id"
                                    :res="res"
                                    :selected="activeReserva?.id === res.id"
                                    avatar-color="blue-lighten-4"
                                    avatar-text-class="text-blue-darken-4"
                                    :get-initials="getInitials"
                                    @click="setActivePatient(res)"
                                >
                                    <template #subtitle>
                                        <div class="d-flex align-center gap-2">
                                            <v-icon size="12" :color="isReservaAtrasada(res) ? 'error' : 'blue-darken-2'">
                                                {{ isReservaAtrasada(res) ? 'mdi-clock-alert' : 'mdi-clock-outline' }}
                                            </v-icon>
                                            <span class="text-caption font-weight-medium"
                                                :class="isReservaAtrasada(res) ? 'text-error' : 'text-blue-darken-2'">
                                                {{ formatTime(res.horaInicioCita) }}
                                            </span>
                                            <v-chip v-if="isReservaAtrasada(res)" color="error" size="x-small"
                                                variant="flat" class="ms-3 text-xxs font-weight-black">ATRASO</v-chip>
                                        </div>
                                    </template>
                                </DoctorColaPacienteItem>
                            </v-list>
                        </div>

                        <!-- 5. Emergencias (Rojo Intenso) -->
                        <div v-if="doctorEmergencias.length > 0" class="bg-red-darken-4 px-4 px-md-6 py-4 border-b">
                            <h3 class="text-caption font-weight-bold text-white text-uppercase mb-4"
                                style="letter-spacing: 1px;">
                                Emergencias del Día
                            </h3>
                            <v-list class="py-0 bg-transparent">
                                <v-list-item v-for="em in doctorEmergencias" :key="em.idEmergencia"
                                    class="px-4 py-3 mb-2 bg-white rounded-lg border-error-left hover-bg-surface-light cursor-pointer"
                                    :class="{ 'selected-item': selectedEmergency?.idEmergencia === em.idEmergencia }"
                                    @click="setActiveEmergency(em)">
                                    <template v-slot:prepend>
                                        <v-avatar color="error" rounded="lg" class="mr-3" size="48">
                                            <v-icon color="white">mdi-alert-decagram</v-icon>
                                        </v-avatar>
                                    </template>
                                    <v-list-item-title class="text-body-2 font-weight-bold text-high-emphasis mb-1">
                                        {{ em.nombrePaciente }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="d-flex flex-column gap-1">
                                        <div class="d-flex align-center gap-2">
                                            <v-icon size="12" color="error">mdi-clock-outline</v-icon>
                                            <span class="text-caption font-weight-bold text-error">
                                                {{ em.horaInicio }} - {{ em.horaFin || 'En curso' }}
                                            </span>
                                        </div>
                                        <div class="text-caption font-weight-bold text-black text-truncate w-100"
                                            style="opacity: 1 !important;">
                                            {{ em.descripcionCaso }}
                                        </div>
                                    </v-list-item-subtitle>
                                </v-list-item>
                            </v-list>
                        </div>

                        <!-- 6. Citas fuera de las colas del día (canceladas, presentes, etc.) -->
                        <div v-if="otrasQueue.length > 0" class="px-4 px-md-6 py-4 border-b">
                            <h3 class="text-caption font-weight-bold text-grey-darken-2 text-uppercase mb-4"
                                style="letter-spacing: 1px;">
                                Otras citas
                            </h3>
                            <v-list class="py-0 bg-transparent">
                                <DoctorColaPacienteItem
                                    v-for="res in otrasQueue"
                                    :key="res.id"
                                    :res="res"
                                    :selected="activeReserva?.id === res.id"
                                    avatar-color="grey-lighten-3"
                                    avatar-text-class="text-grey-darken-3"
                                    :get-initials="getInitials"
                                    @click="setActivePatient(res)"
                                >
                                    <template #subtitle>
                                        <div class="d-flex align-center gap-2">
                                            <v-icon size="12" color="grey-darken-1">mdi-clock-outline</v-icon>
                                            <span class="text-caption font-weight-medium text-grey-darken-1">
                                                {{ formatTime(res.horaInicioCita) }}
                                            </span>
                                            <v-chip size="x-small" variant="tonal" class="ms-2 text-xxs font-weight-black">
                                                {{ res.estado }}
                                            </v-chip>
                                        </div>
                                    </template>
                                </DoctorColaPacienteItem>
                            </v-list>
                        </div>

                        <!-- 7. Sin Reserva (Naranja) -->
                        <div v-if="sinReservaQueue.length > 0" class="bg-orange-lighten-5 px-4 px-md-6 py-4 border-b">
                            <h3 class="text-caption font-weight-bold text-orange-darken-3 text-uppercase mb-4"
                                style="letter-spacing: 1px;">
                                Atenciones Sin Reserva
                            </h3>
                            <v-list class="py-0 bg-transparent">
                                <DoctorColaPacienteItem
                                    v-for="res in sinReservaQueue"
                                    :key="res.id"
                                    :res="res"
                                    :selected="activeReserva?.id === res.id"
                                    avatar-color="orange-lighten-4"
                                    avatar-text-class="text-orange-darken-4"
                                    item-class="border-warning-left"
                                    :get-initials="getInitials"
                                    @click="setActivePatient(res)"
                                >
                                    <template #subtitle>
                                        <div class="d-flex align-center gap-2">
                                            <v-icon size="12" color="orange-darken-2">mdi-walk</v-icon>
                                            <span class="text-caption font-weight-medium text-orange-darken-2">
                                                Atendido sin reserva
                                            </span>
                                        </div>
                                    </template>
                                </DoctorColaPacienteItem>
                            </v-list>
                        </div>

                        <!-- Empty State para toda la cola -->
                        <div v-if="!actualReservaItem && proximasQueue.length === 0 && concluidasQueue.length === 0 && sinReservaQueue.length === 0"
                            class="pa-8 text-center d-flex flex-column align-center">
                            <v-icon color="disabled" size="48" class="mb-2">mdi-account-off-outline</v-icon>
                            <p class="text-body-2 text-medium-emphasis">No hay pacientes esperando</p>
                        </div>


                    </v-card-text>

                    <v-divider></v-divider>

                    <!-- Queue Footer / Progress -->
                    <v-card-actions class="pa-4 pa-md-6 bg-surface-light flex-column align-stretch">
                        <div class="d-flex flex-wrap justify-space-between align-end gap-2 mb-2">
                            <span class="text-caption font-weight-bold text-disabled text-uppercase progress-label"
                                style="letter-spacing: 1px;">
                                Progreso actual de las reservas ({{ completedCount }}/{{ totalCount }})
                            </span>
                            <span class="text-h6 font-weight-black text-primary">{{ progressPct }}%</span>
                        </div>
                        <v-progress-linear :model-value="progressPct" color="primary" height="10" rounded="pill"
                            class="mb-3"></v-progress-linear>
                        <p class="text-caption text-medium-emphasis text-center mb-0">
                            {{ pendingCount }} PACIENTES PENDIENTES
                        </p>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </div>

    <ModalConfirmación v-model="showConfirmModal" :title="confirmModalTitle" :message="confirmModalMessage"
        :type="confirmModalType" :confirmText="confirmModalConfirmText" cancelText="Cancelar"
        @confirm="confirmarAtencion" @cancel="showConfirmModal = false" />

    <!-- Modal de Error para Notificaciones API -->
    <ModalMensaje v-model="showErrorModal" :title="errorTitle" :message="errorMessage" type="error" buttonText="Entendido"
        @confirm="showErrorModal = false" />

    <!-- Modal Atender Sin Reserva -->
    <AtenderSinReservaModal v-model="showAtenderSinReservaModal" :is-emergency="isEmergencyMode"
        @emergency-created="fetchDoctorData" />
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReservasStore } from '@/stores/reservas'
import { useTutorialStore } from '@/stores/tutorial'
import { hasCompletedDoctorTutorial } from '@/utils/tutorialStorage'
import { DOCTOR_TUTORIAL_IDS } from '@/config/doctorTutorialSteps'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'
import ModalMensaje from '@/components/common/ModalMensaje.vue'
import AtenderSinReservaModal from '@/components/reservas/AtenderSinReservaModal.vue'
import { useEmergenciasStore } from '@/stores/emergencias'
import PacienteTipoChips from '@/components/doctor/PacienteTipoChips.vue'
import PacienteDocumentosMenu from '@/components/doctor/PacienteDocumentosMenu.vue'
import DoctorColaPacienteItem from '@/components/doctor/DoctorColaPacienteItem.vue'
import PersonaAvatar from '@/components/common/PersonaAvatar.vue'
import { coincideReservaId, tomarCitaDashboard } from '@/utils/reservaIdentity'

const authStore = useAuthStore()
const reservasStore = useReservasStore()
const emergenciasStore = useEmergenciasStore()
const tutorialStore = useTutorialStore()
const route = useRoute()
const router = useRouter()

// --- State ---
const activeReserva = ref(null)
const selectedEmergency = ref(null)
const doctorReservas = ref([])
const doctorEmergencias = ref([])
const isAtendiendo = ref(false)
const showConfirmModal = ref(false)
const confirmModalTitle = ref("Finalizar Cita")
const confirmModalMessage = ref("¿Estás seguro que deseas marcar esta cita como atendida y finalizar la consulta?")
const confirmModalType = ref("success")
const confirmModalConfirmText = ref("Sí, Atender")

const showErrorModal = ref(false)
const errorTitle = ref('No se pudo atender')
const showAtenderSinReservaModal = ref(false)
const isEmergencyMode = ref(false)
const errorMessage = ref('')
const allReservas = ref([])

// --- Actions ---
const openAtenderSinReservaModal = () => {
    isEmergencyMode.value = false
    showAtenderSinReservaModal.value = true
}

const openEmergencyModal = () => {
    isEmergencyMode.value = true
    showAtenderSinReservaModal.value = true
}

const agendarCitaParaPaciente = (paciente) => {
    if (!paciente) return
    const idUsuarioPaciente = paciente.idUsuario ?? paciente.id
    if (!idUsuarioPaciente) return

    router.push({
        path: '/doctor/agenda',
        query: {
            agendarPacienteId: String(idUsuarioPaciente),
            agendarPacienteNombre: paciente.nombre
        }
    })
}
const fetchDoctorData = async () => {
    const idPersona = authStore.user?.idPersona
    if (idPersona) {
        // Fetch Reservas
        const todasReservas = await reservasStore.fetchReservasByDoctor(idPersona)
        allReservas.value = todasReservas
        doctorReservas.value = todasReservas.filter(r => r.fechaCita === selectedDateStr.value)

        // Fetch Emergencias
        try {
            const todasEmergencias = await emergenciasStore.fetchEmergenciasByDoctor(idPersona)
            doctorEmergencias.value = todasEmergencias.filter(e => e.fechaAtencion === selectedDateStr.value)
        } catch (error) {
            console.error('Error fetching emergencies:', error)
        }

        // Reset active paciente si cambia el día y el paciente actual no pertenece al nuevo día
        if (activeReserva.value && activeReserva.value.fechaCita !== selectedDateStr.value) {
            activeReserva.value = null
        }
        if (selectedEmergency.value && selectedEmergency.value.fechaAtencion !== selectedDateStr.value) {
            selectedEmergency.value = null
        }
    }
}

const atenderPaciente = () => {
    if (!activeReserva.value) return

    if (isReservaAtrasada(activeReserva.value) || (actualReservaItem.value && activeReserva.value.id !== actualReservaItem.value.id && activeReserva.value.estado !== 'A-SIN-RESERVA')) {
        confirmModalTitle.value = "Atender fuera de horario"
        confirmModalMessage.value = "¿Estás seguro que deseas atender esta cita fuera de su horario establecido (está atrasada o aún no es su turno)?"
        confirmModalType.value = "warning"
        confirmModalConfirmText.value = "Sí, Atender"
    } else {
        confirmModalTitle.value = "Finalizar Cita"
        confirmModalMessage.value = "¿Estás seguro que deseas marcar esta cita como atendida y finalizar la consulta?"
        confirmModalType.value = "success"
        confirmModalConfirmText.value = "Sí, Atender"
    }

    showConfirmModal.value = true
}

const confirmarAtencion = async () => {
    showConfirmModal.value = false
    if (!activeReserva.value) return
    isAtendiendo.value = true

    const now = new Date()
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString()
    const fecha = localISOTime.substring(0, 10)
    const hora = localISOTime.substring(11, 19)

    try {
        const res = await reservasStore.markAsAtendido(activeReserva.value.id, {
            fechaAtendido: fecha,
            horaAtendido: hora
        })

        if (res?.success) {
            const paciente = activeReserva.value?.paciente
            activeReserva.value = null
            await router.push({
                path: '/doctor/historial-medico',
                query: {
                    ...(paciente?.id != null ? { pacienteId: String(paciente.id) } : {}),
                    ...(paciente?.nombre ? { nombre: paciente.nombre } : {}),
                },
            })
        } else {
            errorTitle.value = 'No se pudo atender'
            errorMessage.value = reservasStore.error || 'No se pudo realizar la operación'
            showErrorModal.value = true
            console.error('Error al atender paciente:', reservasStore.error)
        }
    } catch (e) {
        errorTitle.value = 'No se pudo atender'
        errorMessage.value = e?.message || 'No se pudo atender'
        showErrorModal.value = true
        console.error(e)
    } finally {
        isAtendiendo.value = false
    }
}

const weekOffset = ref(0)
const selectedDate = ref(new Date())

const formatDateToStr = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const todayDateStr = computed(() => formatDateToStr(new Date()))
const selectedDateStr = computed(() => formatDateToStr(selectedDate.value))

const weekDays = computed(() => {
    const days = []
    const startOfWeek = new Date()
    const dayOfWeek = startOfWeek.getDay()
    // Lunes = 1, Domingo = 0
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    startOfWeek.setDate(diff + (weekOffset.value * 7))

    const names = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    const namesShort = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek)
        d.setDate(startOfWeek.getDate() + i)
        days.push({
            date: d,
            dateStr: formatDateToStr(d),
            dayName: names[i],
            dayNameShort: namesShort[i],
            dayNum: d.getDate()
        })
    }
    return days
})

const currentMonthName = computed(() => {
    const d = new Date(weekDays.value[0].date)
    return d.toLocaleString('es-ES', { month: 'long' }).toUpperCase()
})

const currentYear = computed(() => {
    return weekDays.value[0].date.getFullYear()
})

const selectDate = (date) => {
    selectedDate.value = date
    fetchDoctorData()
}

const moveWeek = (dir) => {
    weekOffset.value += dir
}

const goToToday = () => {
    weekOffset.value = 0
    selectedDate.value = new Date()
    fetchDoctorData()
}

const syncWeekOffsetForDate = (dateStr) => {
    const target = new Date(`${dateStr}T00:00:00`)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const startOfThisWeek = new Date(today)
    startOfThisWeek.setDate(diff)
    startOfThisWeek.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    weekOffset.value = Math.round((target.getTime() - startOfThisWeek.getTime()) / (7 * 86400000))
}

const getCountForDate = (dateStr) => {
    return allReservas.value.filter(r => r.fechaCita === dateStr).length
}

// --- Computed ---
const doctorName = computed(() => {
    const p = authStore.user
    if (p && p.nombres) return `Dr. ${p.nombres} ${p.primerApellido || ''}`.trim()
    return 'Doctor/a'
})

const especialidadName = computed(() => {
    return authStore.user?.doctor?.especialidad?.nombre || 'MEDICINA GENERAL'
})

const pendingQueue = computed(() => {
    return doctorReservas.value
        .filter(r => r.estado === 'PENDIENTE')
        .sort((a, b) => a.horaInicioCita.localeCompare(b.horaInicioCita))
})

const atrasadasQueue = computed(() => {
    return doctorReservas.value
        .filter(r => isReservaAtrasada(r))
        .sort((a, b) => (a.horaInicioCita || '').localeCompare(b.horaInicioCita || ''))
})

const validPendingQueue = computed(() => {
    return pendingQueue.value.filter(r => !isReservaAtrasada(r))
})

const actualReservaItem = computed(() => {
    return validPendingQueue.value[0] || null
})

const proximasQueue = computed(() => {
    return validPendingQueue.value.slice(1)
})

const sinReservaQueue = computed(() => {
    return doctorReservas.value
        .filter(r => r.estado === 'A-SIN-RESERVA')
        .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
})

const ESTADOS_RESERVA_COMPLETADA = ['ATENDIDO', 'A-FUERA-HORARIO', 'A-SIN-RESERVA']
const ESTADOS_RESERVA_CANCELADA = ['CANCELADA', 'CANCELADO', 'RECHAZADA', 'ANULADA']
/** Ya resueltas o vencidas: cuentan en el progreso del día. */
const ESTADOS_RESERVA_EN_PROGRESO = [
    ...ESTADOS_RESERVA_COMPLETADA,
    'ATRASO',
    'ABANDONO',
]

const reservasParaProgreso = computed(() =>
    doctorReservas.value.filter((r) => !ESTADOS_RESERVA_CANCELADA.includes(r.estado))
)

const isReservaContadaEnProgreso = (reserva) => {
    if (!reserva) return false
    if (ESTADOS_RESERVA_EN_PROGRESO.includes(reserva.estado)) return true
    // PENDIENTE cuya hora fin ya pasó (hasta que el cron marque ATRASO)
    return isReservaAtrasada(reserva)
}

const concluidasQueue = computed(() => {
    return doctorReservas.value
        .filter(r => ESTADOS_RESERVA_COMPLETADA.includes(r.estado))
        .sort((a, b) => (a.horaInicioCita || '').localeCompare(b.horaInicioCita || ''))
})

const idsEnColasVisibles = computed(() => {
    const ids = new Set()
    for (const reserva of concluidasQueue.value) ids.add(reserva.id)
    for (const reserva of atrasadasQueue.value) ids.add(reserva.id)
    if (actualReservaItem.value) ids.add(actualReservaItem.value.id)
    for (const reserva of proximasQueue.value) ids.add(reserva.id)
    for (const reserva of sinReservaQueue.value) ids.add(reserva.id)
    return ids
})

const otrasQueue = computed(() => {
    return doctorReservas.value
        .filter((reserva) => !idsEnColasVisibles.value.has(reserva.id))
        .sort((a, b) => (a.horaInicioCita || '').localeCompare(b.horaInicioCita || ''))
})

const completedCount = computed(() => {
    const reservasAvanzadas = reservasParaProgreso.value.filter((r) =>
        isReservaContadaEnProgreso(r)
    ).length
    return reservasAvanzadas + doctorEmergencias.value.length
})

const totalCount = computed(() =>
    reservasParaProgreso.value.length + doctorEmergencias.value.length
)

const pendingCount = computed(() => Math.max(0, totalCount.value - completedCount.value))

const progressPct = computed(() => {
    if (totalCount.value === 0) return 100
    return Math.round((completedCount.value / totalCount.value) * 100)
})

const closestReservaId = computed(() => {
    if (doctorReservas.value.length === 0) return null
    const now = new Date()
    const currentTimeStr = now.toTimeString().slice(0, 5) // "HH:mm"

    // Sort pending reservas by time
    const pending = doctorReservas.value
        .filter(r => r.estado === 'PENDIENTE')
        .sort((a, b) => a.horaInicioCita.localeCompare(b.horaInicioCita))

    if (pending.length === 0) return null

    // Find the first one that is >= now, or just the first one if all are past
    const upcoming = pending.find(r => r.horaInicioCita.slice(0, 5) >= currentTimeStr)
    return upcoming ? upcoming.id : pending[0].id
})

// --- Utils ---
const getInitials = (name) => {
    if (!name) return '??'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const formatTime = (time) => {
    if (!time) return '--:--'
    return time.slice(0, 5) // HH:mm
}

/** True si ya pasó la hora fin de la cita (misma regla que el job del backend). */
const isPastEndReservation = (reserva) => {
    if (!reserva || !reserva.fechaCita) return false
    const horaFin = reserva.horaFinCita || reserva.horaInicioCita
    if (!horaFin) return false

    const now = new Date()
    const todayStr = formatDateToStr(now)
    const currentTimeStr = now.toTimeString().slice(0, 5) // "HH:mm"
    const finShort = String(horaFin).slice(0, 5)

    if (reserva.fechaCita < todayStr) return true
    if (reserva.fechaCita === todayStr) {
        return currentTimeStr > finShort
    }
    return false
}

const isReservaAtrasada = (reserva) => {
    if (!reserva) return false
    if (reserva.estado === 'ATRASO') return true
    // Puente hasta que el cron marque ATRASO (máx. ~1 min)
    if (reserva.estado === 'PENDIENTE') return isPastEndReservation(reserva)
    return false
}

const setActivePatient = (reserva) => {
    selectedEmergency.value = null
    activeReserva.value = reserva
}

const asegurarReservaEnDia = (reserva, reservaId) => {
    if (!reserva) return null
    const fecha = reserva.fechaCita
    if (fecha && fecha !== selectedDateStr.value) {
        selectedDate.value = new Date(`${fecha}T00:00:00`)
        syncWeekOffsetForDate(fecha)
        doctorReservas.value = allReservas.value.filter((r) => r.fechaCita === fecha)
    }
    const yaEnDia = doctorReservas.value.find(
        (r) => coincideReservaId(r, reservaId) || coincideReservaId(r, reserva.id),
    )
    if (yaEnDia) return yaEnDia
    doctorReservas.value = [...doctorReservas.value, reserva]
    return reserva
}

const abrirCitaDesdeQuery = async () => {
    const fecha = typeof route.query.fecha === 'string' ? route.query.fecha : ''
    const reservaId = typeof route.query.reservaId === 'string' ? route.query.reservaId : ''
    if (!fecha && !reservaId) return false

    if (fecha) {
        selectedDate.value = new Date(`${fecha}T00:00:00`)
        syncWeekOffsetForDate(fecha)
    }

    await fetchDoctorData()

    if (reservaId) {
        const guardada = tomarCitaDashboard(reservaId)
        let reserva = doctorReservas.value.find((r) => coincideReservaId(r, reservaId))
            || allReservas.value.find((r) => coincideReservaId(r, reservaId))
            || guardada

        if (!reserva && !reservaId.startsWith('cancelled_')) {
            reserva = await reservasStore.fetchReservaById(reservaId)
        }

        const visible = asegurarReservaEnDia(reserva, reservaId)
        if (visible) setActivePatient(visible)
    }

    router.replace({ path: route.path })
    return true
}

onMounted(async () => {
    const abiertaDesdeQuery = await abrirCitaDesdeQuery()
    if (!abiertaDesdeQuery) {
        await fetchDoctorData()
    }

    const userId = authStore.user?.idUsuario
    const isDoctorRole = authStore.user?.rol === 'DOCTOR' || authStore.user?.rol === 'SUPERUSUARIO'
    if (
        isDoctorRole &&
        userId &&
        !hasCompletedDoctorTutorial(DOCTOR_TUTORIAL_IDS.MENU, userId) &&
        !authStore.user?.mustChangePassword &&
        !tutorialStore.active
    ) {
        await nextTick()
        setTimeout(() => {
            tutorialStore.start({
                tutorialId: DOCTOR_TUTORIAL_IDS.MENU,
                mode: 'auto',
                routePath: '/doctor/home',
            })
        }, 600)
    }
})

const setActiveEmergency = (emergency) => {
    activeReserva.value = null
    selectedEmergency.value = emergency
}
</script>

<style scoped>
.home-doctor-page {
    width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
}

.max-width-form {
    max-width: 1200px;
}

.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12) !important;
}

.premium-card {
    background-color: white;
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

.section-badge.success {
    background-color: rgb(var(--v-theme-success));
}

.min-width-0 {
    min-width: 0;
}

.border-b {
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.max-width-400 {
    max-width: 400px;
}

.hover-bg-surface-light:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.cursor-pointer {
    cursor: pointer;
}

.border-primary-left {
    border-left: 4px solid rgb(var(--v-theme-primary)) !important;
}

.border-success-left {
    border-left: 4px solid rgb(var(--v-theme-success)) !important;
}

.border-error-left {
    border-left: 4px solid rgb(var(--v-theme-error)) !important;
}

.selected-item {
    background-color: #f1f5f9 !important;
    opacity: 0.5;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 3px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
}

.calendar-day-item {
    min-width: 0;
    width: 100%;
}

.dot-container {
    height: 8px;
    display: flex;
    align-items: center;
}

.today-dot {
    width: 6px;
    height: 6px;
    background-color: rgb(var(--v-theme-primary));
    border-radius: 50%;
}

.dot-active {
    background-color: white !important;
}

.queue-container {
    max-height: calc(100vh - 400px);
}

@media (min-width: 1280px) {
    .queue-container {
        max-height: calc(100vh - 350px);
    }
}

.calendar-day-item:hover:not(.active-day) {
    background-color: rgba(var(--v-theme-primary), 0.05);
}

.active-day {
    background-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 8px 16px -5px rgba(var(--v-theme-primary), 0.35);
}

@media (max-width: 600px) {
    .calendar-grid {
        gap: 2px;
    }

    .calendar-day-item {
        padding-left: 1px !important;
        padding-right: 1px !important;
    }

    .calendar-day-item .calendar-day-num {
        font-size: 0.95rem !important;
    }

    .calendar-day-name {
        font-size: 0.6rem !important;
    }

    .date-count {
        font-size: 8px;
        padding: 1px 3px;
    }

    .active-day {
        transform: none;
    }

    .progress-label {
        flex: 1 1 100%;
        line-height: 1.3;
    }
}

.is-today:not(.active-day) {
    border: 2px solid rgba(var(--v-theme-primary), 0.2);
}

.is-today {
    border: 2px solid transparent;
}

.transition-all {
    transition: all 0.2s ease;
}

.date-count {
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 6px;
    line-height: 1;
}

.bg-primary-lighten-5 {
    background-color: #E8EAF6 !important;
}

.btn-header-main {
    max-width: 100%;
    white-space: normal !important;
    height: auto !important;
    min-height: 44px;
    line-height: 1.2;
    padding: 8px 12px !important;
}

@media (max-width: 600px) {
    .btn-header-main {
        font-size: 0.7rem !important;
        padding: 6px 6px !important;
    }
}

.text-xxs {
    font-size: 0.65rem !important;
    height: 18px !important;
}

.calendar-day-name,
.calendar-day-num {
    line-height: 1.1;
    max-width: 100%;
    text-align: center;
}

.calendar-week-title {
    min-width: 0;
    flex: 1 1 auto;
    text-align: center;
}
</style>

