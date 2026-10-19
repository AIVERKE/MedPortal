<template>
    <div v-if="loadingForm" class="max-width-form mx-auto pb-8 text-center pa-12">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="text-body-1 text-grey-darken-1 mt-4 mb-0">Cargando formulario…</p>
    </div>

    <div v-else-if="formulario" class="builder-shell d-flex flex-column">
        <!-- Sticky header -->
        <header class="builder-header d-flex align-center justify-space-between flex-wrap ga-3 px-4 px-md-6 py-3">
            <div class="d-flex align-center ga-3 flex-grow-1 min-width-0">
                <v-btn
                    icon="mdi-arrow-left"
                    variant="text"
                    color="grey-darken-1"
                    rounded="lg"
                    :to="'/formularios'"
                />
                <div
                    ref="titleWrapRef"
                    class="builder-title-field-wrap"
                    :class="{
                        'builder-title-field-wrap--mobile': mobile,
                        'fade-end': titleFadeEnd,
                        'fade-start': titleFadeStart,
                    }"
                >
                    <v-text-field
                        v-model="formTitle"
                        variant="plain"
                        density="compact"
                        hide-details
                        class="builder-title-field"
                        @update:model-value="updateTitleFade"
                    />
                </div>
                <v-chip
                    :color="formulario.statusColor"
                    size="small"
                    variant="tonal"
                    class="font-weight-black text-uppercase flex-shrink-0"
                    style="letter-spacing: 0.05em;"
                >
                    {{ formulario.status }}
                </v-chip>
                <v-chip
                    size="small"
                    variant="outlined"
                    color="grey"
                    class="font-weight-bold flex-shrink-0 d-none d-md-flex"
                >
                    {{ sections.length }} secciones · {{ totalFields }} campos
                </v-chip>
                <v-menu location="bottom" :close-on-content-click="false">
                    <template #activator="{ props: infoProps }">
                        <v-btn
                            v-bind="infoProps"
                            icon="mdi-information-outline"
                            variant="text"
                            color="grey-darken-1"
                            size="small"
                            rounded="lg"
                            class="flex-shrink-0"
                            aria-label="Información de auditoría"
                        />
                    </template>
                    <v-card min-width="280" max-width="340" class="pa-4">
                        <p class="text-caption font-weight-black text-uppercase text-grey-darken-1 mb-3"
                            style="letter-spacing: 0.06em;">
                            Historial de la plantilla
                        </p>
                        <div class="mb-3">
                            <p class="text-caption text-grey-darken-1 mb-1">Último guardado / edición</p>
                            <p class="text-body-2 font-weight-bold mb-0">
                                {{ auditoria.ultimoGuardado?.nombreCompleto || 'Sin registro' }}
                            </p>
                            <p class="text-caption text-grey mb-0">
                                {{ auditoria.ultimoGuardado?.accion || 'Guardó/editó' }}
                                <span v-if="auditoria.ultimoGuardado?.fecha">
                                    · {{ auditoria.ultimoGuardado.rol ? formatRoleName(auditoria.ultimoGuardado.rol) : '—' }}
                                    · {{ formatAuditDate(auditoria.ultimoGuardado.fecha) }}
                                </span>
                            </p>
                        </div>
                        <div>
                            <p class="text-caption text-grey-darken-1 mb-1">Última publicación</p>
                            <p class="text-body-2 font-weight-bold mb-0">
                                {{ auditoria.ultimaPublicacion?.nombreCompleto || 'Aún no publicada' }}
                            </p>
                            <p class="text-caption text-grey mb-0">
                                {{ auditoria.ultimaPublicacion?.accion || 'Publicó' }}
                                <span v-if="auditoria.ultimaPublicacion?.fecha">
                                    · {{ auditoria.ultimaPublicacion.rol ? formatRoleName(auditoria.ultimaPublicacion.rol) : '—' }}
                                    · {{ formatAuditDate(auditoria.ultimaPublicacion.fecha) }}
                                </span>
                            </p>
                        </div>
                    </v-card>
                </v-menu>
            </div>

            <div class="d-flex align-center ga-2 flex-shrink-0">
                <v-menu location="bottom end">
                    <template #activator="{ props: menuProps }">
                        <v-btn
                            v-bind="menuProps"
                            variant="text"
                            color="primary"
                            prepend-icon="mdi-eye-outline"
                            class="text-none font-weight-bold"
                            rounded="lg"
                        >
                            <span class="d-none d-sm-inline">Vista previa</span>
                        </v-btn>
                    </template>
                    <v-list density="compact" min-width="240">
                        <v-list-item
                            prepend-icon="mdi-file-document-edit-outline"
                            title="Borrador actual"
                            subtitle="Lo que estás editando"
                            rounded="lg"
                            @click="openPreview('draft')"
                        />
                        <v-list-item
                            prepend-icon="mdi-publish"
                            title="Última publicada"
                            :subtitle="hasPublished ? 'Versión de llenado' : 'Aún no hay versión publicada'"
                            :disabled="!hasPublished"
                            rounded="lg"
                            @click="openPreview('published')"
                        />
                    </v-list>
                </v-menu>
                <v-btn
                    :variant="saveStatus === 'saved' ? 'tonal' : 'flat'"
                    :color="saveStatus === 'saved' ? 'success' : 'primary'"
                    class="text-none font-weight-bold"
                    rounded="lg"
                    :loading="saveStatus === 'saving'"
                    :disabled="saveStatus === 'saved' || saveStatus === 'saving'"
                    :prepend-icon="saveStatus === 'saved' ? 'mdi-check' : undefined"
                    @click="saveNow"
                >
                    {{ saveButtonLabel }}
                </v-btn>
                <v-btn
                    :variant="isInSyncWithPublished ? 'tonal' : 'flat'"
                    :color="isInSyncWithPublished ? 'success' : 'primary'"
                    :prepend-icon="isInSyncWithPublished ? 'mdi-check' : 'mdi-publish'"
                    class="text-none font-weight-bold"
                    rounded="lg"
                    :loading="publishing"
                    :disabled="isInSyncWithPublished || publishing"
                    @click="publishDialog = true"
                >
                    {{ isInSyncWithPublished ? 'Publicado' : 'Publicar' }}
                </v-btn>
                <v-menu location="bottom end">
                    <template #activator="{ props: moreProps }">
                        <v-btn
                            v-bind="moreProps"
                            icon="mdi-dots-vertical"
                            variant="text"
                            color="grey-darken-1"
                            rounded="lg"
                        />
                    </template>
                    <v-list density="compact" min-width="240">
                        <v-list-item
                            prepend-icon="mdi-backup-restore"
                            title="Volver a versión publicada"
                            subtitle="Descarta cambios del borrador"
                            :disabled="!canRevertToPublished"
                            rounded="lg"
                            @click="openRevertDialog"
                        />
                        <v-list-item
                            prepend-icon="mdi-delete-outline"
                            title="Eliminar formulario"
                            class="text-error"
                            rounded="lg"
                            @click="deleteFormDialog = true"
                        />
                    </v-list>
                </v-menu>
            </div>
        </header>

        <!-- Workspace -->
        <div class="builder-workspace d-flex flex-grow-1 overflow-hidden">
            <!-- Canvas -->
            <div class="builder-canvas flex-grow-1 overflow-y-auto pa-4 pa-md-8">
                <div class="builder-canvas-inner mx-auto">
                    <!-- Form header -->
                    <v-card
                        class="mb-6 rounded-xl shadow-premium premium-card position-relative form-header-card"
                        border
                    >
                        <div class="section-badge primary"></div>
                        <v-card-text class="pa-6 pa-md-8 form-header-fields">
                            <v-textarea
                                v-model="formTitle"
                                variant="plain"
                                density="comfortable"
                                hide-details
                                auto-grow
                                rows="1"
                                no-resize
                                placeholder="Título del Formulario"
                                class="form-header-title mb-2"
                            />
                            <v-textarea
                                v-model="formHeaderDescription"
                                variant="plain"
                                density="comfortable"
                                hide-details
                                auto-grow
                                rows="1"
                                no-resize
                                placeholder="Descripción del formulario..."
                                class="form-header-description"
                            />
                        </v-card-text>
                    </v-card>

                    <!-- Sections -->
                    <draggable
                        v-model="sections"
                        item-key="id"
                        handle=".section-drag-handle"
                        ghost-class="section-drag-ghost"
                        animation="200"
                    >
                        <template #item="{ element }">
                            <FormBuilderSection
                                :section="element"
                                :active-field-id="activeFieldId"
                                :prefer-expanded="expandSectionId === element.id"
                                @select-field="selectField"
                                @add-field="addFieldToSection"
                                @delete-field="openDeleteFieldDialog"
                            />
                        </template>
                    </draggable>

                    <v-btn
                        variant="outlined"
                        color="primary"
                        rounded="xl"
                        prepend-icon="mdi-folder-plus-outline"
                        class="text-none font-weight-bold"
                        block
                        size="large"
                        @click="addSection"
                    >
                        Añadir sección
                    </v-btn>
                </div>
            </div>

            <!-- Right panel -->
            <aside v-if="!mobile" class="builder-sidebar">
                <div class="builder-sidebar-scroll">
                    <div class="pa-6 border-b" ref="categoriaPanelRef">
                        <p class="text-caption font-weight-black text-uppercase text-grey-darken-1 mb-2 d-flex align-center ga-2"
                            style="letter-spacing: 0.08em;">
                            <v-icon size="18">mdi-shape-outline</v-icon>
                            Tipo de formulario
                        </p>
                        <p class="text-caption text-grey-darken-1 mb-3">
                            Obligatorio para publicar.
                        </p>
                        <v-select
                            v-model="formCategoria"
                            :items="categoriaOptions"
                            item-title="title"
                            item-value="value"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            hide-details="auto"
                            clearable
                            placeholder="Seleccionar tipo"
                            :error="categoriaError"
                            :error-messages="categoriaError ? 'Elige un tipo para publicar' : undefined"
                        />
                    </div>

                    <div class="pa-6 border-b role-permissions-panel">
                        <p class="text-caption font-weight-black text-uppercase text-grey-darken-1 mb-2 d-flex align-center ga-2"
                            style="letter-spacing: 0.08em;">
                            <v-icon size="18">mdi-account-lock-outline</v-icon>
                            Permisos por rol
                        </p>
                        <p class="text-caption text-grey-darken-1 mb-4">
                            Controla quién puede ver, crear, editar o eliminar instancias de este formulario.
                        </p>

                        <div v-if="rolesStore.loading && !rolePermissions.length" class="text-center py-4">
                            <v-progress-circular indeterminate size="24" color="primary" />
                        </div>

                        <div v-else-if="!rolePermissions.length" class="text-center py-4">
                            <span class="text-caption text-grey">No hay roles disponibles</span>
                        </div>

                        <div v-else>
                            <div class="role-permissions-grid role-permissions-grid--head">
                                <span class="text-caption font-weight-bold text-grey-darken-2">Rol</span>
                                <span
                                    v-for="permission in formPermissionOptions"
                                    :key="permission.key"
                                    class="text-caption font-weight-bold text-grey-darken-2 text-center"
                                    :title="permission.description"
                                >
                                    {{ permission.title }}
                                </span>
                            </div>

                            <div
                                v-for="role in rolePermissions"
                                :key="role.idRol"
                                class="role-permissions-grid"
                            >
                                <span class="text-caption text-grey-darken-3 text-truncate" :title="role.nombre">
                                    {{ formatRoleName(role.nombre) }}
                                </span>
                                <v-checkbox
                                    v-for="permission in formPermissionOptions"
                                    :key="permission.key"
                                    :model-value="role[permission.key]"
                                    hide-details
                                    density="compact"
                                    color="primary"
                                    class="role-permission-check"
                                    :aria-label="`${permission.title} para ${role.nombre}`"
                                    @update:model-value="toggleRolePermission(role, permission.key, $event)"
                                />
                            </div>
                        </div>

                        <v-alert
                            v-if="!hasAnyFillPermission"
                            type="warning"
                            variant="tonal"
                            density="compact"
                            class="mt-4 text-caption"
                        >
                            Ningún rol puede llenar este formulario.
                        </v-alert>
                    </div>

                    <div class="pa-6 border-b fill-mode-panel">
                        <p class="text-caption font-weight-black text-uppercase text-grey-darken-1 mb-4 d-flex align-center ga-2"
                            style="letter-spacing: 0.08em;">
                            <v-icon size="18">mdi-file-document-edit-outline</v-icon>
                            Modo de llenado
                        </p>

                        <v-radio-group
                            v-model="fillMode"
                            density="compact"
                            hide-details
                            class="fill-mode-radio-group"
                        >
                            <v-radio
                                v-for="option in fillModeOptions"
                                :key="option.value"
                                :value="option.value"
                                color="primary"
                                class="mb-2"
                            >
                                <template #label>
                                    <div>
                                        <span class="text-body-2 font-weight-bold text-grey-darken-3 d-block">
                                            {{ option.title }}
                                        </span>
                                        <span class="text-caption text-grey-darken-1">
                                            {{ option.description }}
                                        </span>
                                    </div>
                                </template>
                            </v-radio>
                        </v-radio-group>

                        <v-text-field
                            v-if="fillMode === 'limited'"
                            v-model.number="fillLimit"
                            label="Número máximo de instancias"
                            type="number"
                            min="1"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            hide-details="auto"
                            prepend-inner-icon="mdi-numeric"
                            class="mt-2"
                        />

                        <v-alert
                            v-if="fillMode === 'single'"
                            type="info"
                            variant="tonal"
                            density="compact"
                            class="mt-3 text-caption"
                        >
                            Solo habrá una instancia guardada. Podrá modificarse sin crear copias nuevas.
                        </v-alert>

                        <v-alert
                            v-else-if="fillMode === 'limited'"
                            type="warning"
                            variant="tonal"
                            density="compact"
                            class="mt-3 text-caption"
                        >
                            Se podrán crear hasta {{ fillLimit || 1 }} instancias independientes, todas editables.
                        </v-alert>

                        <v-alert
                            v-else
                            type="success"
                            variant="tonal"
                            density="compact"
                            class="mt-3 text-caption"
                        >
                            No hay tope de instancias. Cada una se crea y edita por separado.
                        </v-alert>
                    </div>

                    <div class="pa-6 border-b">
                        <p class="text-caption font-weight-black text-uppercase text-grey-darken-1 mb-2 d-flex align-center ga-2"
                            style="letter-spacing: 0.08em;">
                            <v-icon size="18">mdi-shield-lock-outline</v-icon>
                            Visibilidad de instancias
                        </p>
                        <p class="text-caption text-grey-darken-1 mb-3">
                            Define si las respuestas llenadas son confidenciales.
                        </p>
                        <v-radio-group
                            v-model="visibilidadInstancias"
                            density="compact"
                            hide-details
                        >
                            <v-radio
                                v-for="option in visibilidadInstanciasOptions"
                                :key="option.value"
                                :value="option.value"
                                color="primary"
                                class="mb-2"
                            >
                                <template #label>
                                    <div>
                                        <span class="text-body-2 font-weight-bold text-grey-darken-3 d-block">
                                            {{ option.title }}
                                        </span>
                                        <span class="text-caption text-grey-darken-1">
                                            {{ option.description }}
                                        </span>
                                    </div>
                                </template>
                            </v-radio>
                        </v-radio-group>
                        <v-alert
                            v-if="visibilidadInstancias === 'privado'"
                            type="warning"
                            variant="tonal"
                            density="compact"
                            class="mt-3 text-caption"
                        >
                            Solo quien llenó cada instancia podrá verla. Ideal para notas psicológicas.
                        </v-alert>
                    </div>

                    <div class="pa-6 border-b">
                        <p class="text-caption font-weight-black text-uppercase text-grey-darken-1 mb-4"
                            style="letter-spacing: 0.08em;">
                            Añadir
                        </p>
                        <draggable
                            :list="fieldTools"
                            :group="{ name: 'fields', pull: 'clone', put: false }"
                            :clone="cloneFieldTool"
                            item-key="type"
                            :sort="false"
                            :force-fallback="true"
                            :fallback-on-body="true"
                            :distance="10"
                            class="d-grid field-tools-grid ga-2 mb-4"
                        >
                            <template #item="{ element }">
                                <div
                                    class="field-tool-item"
                                    @click="addFieldToActiveSection(element.type)"
                                >
                                    <v-btn
                                        variant="outlined"
                                        rounded="xl"
                                        class="field-tool-btn text-none"
                                        stacked
                                        tabindex="-1"
                                    >
                                        <v-icon :icon="element.icon" size="22" class="mb-1" />
                                        <span class="text-caption font-weight-bold">{{ element.label }}</span>
                                    </v-btn>
                                </div>
                            </template>
                        </draggable>
                        <v-btn
                            variant="tonal"
                            color="primary"
                            rounded="lg"
                            prepend-icon="mdi-folder-plus-outline"
                            class="text-none font-weight-bold"
                            block
                            @click="addSection"
                        >
                            Nueva sección
                        </v-btn>
                    </div>

                    <div v-if="sections.length" class="px-6 pt-4 border-b pb-4">
                    <p class="text-caption font-weight-black text-uppercase text-grey-darken-1 mb-3"
                        style="letter-spacing: 0.08em;">
                        Índice de secciones
                    </p>
                    <draggable
                        v-model="sections"
                        item-key="id"
                        ghost-class="section-index-ghost"
                        animation="200"
                        class="d-flex flex-column ga-1"
                    >
                        <template #item="{ element, index }">
                            <v-btn
                                variant="text"
                                :color="activeSectionId === element.id ? 'primary' : 'grey-darken-2'"
                                class="text-none justify-start px-2 section-index-btn"
                                :class="{ 'section-index-btn--active': activeSectionId === element.id }"
                                rounded="lg"
                                @click="scrollToSection(element.id)"
                                @contextmenu.prevent="openSectionContextMenu($event, element)"
                            >
                                <span class="text-caption font-weight-black text-primary mr-2">{{ index + 1 }}</span>
                                <span class="text-body-2 text-truncate">{{ element.title }}</span>
                            </v-btn>
                        </template>
                    </draggable>
                </div>

                <div ref="propertiesPanelRef" class="pa-6">
                    <p class="text-caption font-weight-black text-uppercase text-grey-darken-1 mb-6 d-flex align-center ga-2"
                        style="letter-spacing: 0.08em;">
                        <v-icon size="18">mdi-tune</v-icon>
                        Propiedades
                    </p>

                    <template v-if="activeField">
                        <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold mb-4">
                            {{ activeSectionTitle }}
                        </v-chip>

                        <div class="d-flex flex-column ga-6">
                            <div>
                                <label class="text-body-2 font-weight-bold text-grey-darken-3 mb-2 d-block">
                                    Etiqueta del campo
                                </label>
                                <v-text-field
                                    v-model="activeField.label"
                                    variant="outlined"
                                    density="comfortable"
                                    rounded="lg"
                                    hide-details
                                />
                            </div>

                            <div>
                                <label class="text-body-2 font-weight-bold text-grey-darken-3 mb-2 d-block">
                                    Tipo de campo
                                </label>
                                <v-select
                                    v-model="activeField.type"
                                    :items="fieldTypeOptions"
                                    item-title="title"
                                    item-value="value"
                                    variant="outlined"
                                    density="comfortable"
                                    rounded="lg"
                                    hide-details
                                    :prepend-inner-icon="fieldTypeIcons[activeField.type]"
                                    @update:model-value="onActiveFieldTypeChange"
                                />
                            </div>

                            <div
                                v-if="activeField.type === 'single_choice' || activeField.type === 'multiple_choice'"
                            >
                                <label class="text-body-2 font-weight-bold text-grey-darken-3 mb-2 d-block">
                                    Opciones
                                </label>
                                <div class="d-flex flex-column ga-2">
                                    <div
                                        v-for="(option, index) in activeField.options"
                                        :key="index"
                                        class="d-flex align-center ga-2"
                                    >
                                        <v-text-field
                                            v-model="activeField.options[index]"
                                            variant="outlined"
                                            density="compact"
                                            rounded="lg"
                                            hide-details
                                            placeholder="Opción"
                                            class="flex-grow-1"
                                        />
                                        <v-btn
                                            icon="mdi-close"
                                            variant="text"
                                            color="grey"
                                            size="small"
                                            @click="removeActiveFieldOption(index)"
                                        />
                                    </div>
                                    <v-btn
                                        variant="tonal"
                                        color="primary"
                                        size="small"
                                        prepend-icon="mdi-plus"
                                        class="text-none align-self-start"
                                        @click="addActiveFieldOption"
                                    >
                                        Añadir opción
                                    </v-btn>
                                </div>
                            </div>

                            <div>
                                <label class="text-body-2 font-weight-bold text-grey-darken-3 mb-2 d-block">
                                    Texto de ayuda
                                </label>
                                <v-textarea
                                    v-model="activeField.helpText"
                                    placeholder="Ej: Describa brevemente el síntoma principal..."
                                    variant="outlined"
                                    density="comfortable"
                                    rounded="lg"
                                    rows="2"
                                    hide-details
                                />
                            </div>

                            <v-divider />

                            <div>
                                <p class="text-body-2 font-weight-bold text-grey-darken-3 mb-4">Validaciones</p>
                                <v-switch
                                    v-model="activeField.required"
                                    label="Campo obligatorio"
                                    color="primary"
                                    density="compact"
                                    hide-details
                                    inset
                                    class="mb-4"
                                />
                                <label
                                    v-if="activeField.type === 'short_text' || activeField.type === 'long_text'"
                                    class="text-caption text-grey-darken-1 mb-2 d-block"
                                >
                                    Límite de caracteres
                                </label>
                                <div
                                    v-if="activeField.type === 'short_text' || activeField.type === 'long_text'"
                                    class="d-flex ga-2"
                                >
                                    <v-text-field
                                        v-model="activeField.minLength"
                                        placeholder="Min"
                                        type="number"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        hide-details
                                    />
                                    <v-text-field
                                        v-model="activeField.maxLength"
                                        placeholder="Max"
                                        type="number"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        hide-details
                                    />
                                </div>
                            </div>
                        </div>
                    </template>

                    <div v-else class="text-center pa-6 text-grey-darken-1">
                        <v-icon size="40" color="grey-lighten-1" class="mb-3">mdi-cursor-default-click-outline</v-icon>
                        <p class="text-body-2 mb-0">
                            Selecciona un campo del formulario para ver sus propiedades.
                        </p>
                    </div>
                </div>
                </div>
            </aside>
        </div>
    </div>

    <div v-else class="max-width-form mx-auto pb-8 text-center pa-12">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-file-document-remove-outline</v-icon>
        <h3 class="text-h5 font-weight-bold text-grey-darken-3 mb-2">Formulario no encontrado</h3>
        <p class="text-body-1 text-grey-darken-1 mb-6">
            {{ loadError || 'El formulario que buscas no existe o fue eliminado.' }}
        </p>
        <v-btn color="primary" rounded="lg" variant="flat" to="/formularios" prepend-icon="mdi-arrow-left">
            Volver a formularios
        </v-btn>
    </div>

    <teleport to="body">
        <div
            v-if="sectionContextMenu.open"
            class="section-context-overlay"
            @click="closeSectionContextMenu"
            @contextmenu.prevent="closeSectionContextMenu"
        >
            <v-card
                class="section-context-menu rounded-lg"
                elevation="8"
                :style="{ top: `${sectionContextMenu.y}px`, left: `${sectionContextMenu.x}px` }"
                @click.stop
            >
                <v-list density="compact" nav>
                    <v-list-item
                        prepend-icon="mdi-pencil-outline"
                        title="Editar título"
                        rounded="lg"
                        @click="openEditSectionDialog"
                    />
                    <v-list-item
                        prepend-icon="mdi-delete-outline"
                        title="Eliminar sección"
                        rounded="lg"
                        class="text-error"
                        @click="openDeleteSectionDialog"
                    />
                </v-list>
            </v-card>
        </div>
    </teleport>

    <v-dialog v-model="editSectionDialog.open" max-width="520">
        <v-card rounded="xl" class="pa-4">
            <v-card-title class="text-h6 font-weight-bold px-0">
                Editar sección
            </v-card-title>
            <v-card-text class="px-0 pt-2">
                <v-text-field
                    v-model="editSectionDialog.title"
                    label="Título de la sección"
                    variant="outlined"
                    rounded="lg"
                    density="comfortable"
                    class="mb-4"
                />
                <v-textarea
                    v-model="editSectionDialog.description"
                    label="Descripción (opcional)"
                    variant="outlined"
                    rounded="lg"
                    density="comfortable"
                    rows="2"
                    auto-grow
                />
            </v-card-text>
            <v-card-actions class="px-0">
                <v-spacer />
                <v-btn variant="text" class="text-none" @click="editSectionDialog.open = false">
                    Cancelar
                </v-btn>
                <v-btn color="primary" variant="flat" class="text-none font-weight-bold" @click="saveSectionEdit">
                    Guardar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <ModalConfirmación
        v-model="deleteSectionDialog.open"
        title="Eliminar sección"
        :message="deleteSectionMessage"
        type="error"
        confirm-text="Eliminar"
        @confirm="confirmDeleteSection"
        @cancel="deleteSectionDialog.open = false"
    />

    <ModalConfirmación
        v-model="deleteFieldDialog.open"
        title="Eliminar pregunta"
        :message="deleteFieldMessage"
        type="error"
        confirm-text="Eliminar"
        @confirm="confirmDeleteField"
        @cancel="deleteFieldDialog.open = false"
    />

    <ModalConfirmación
        v-model="publishDialog"
        title="¿Publicar formulario?"
        message="Se actualizará la versión de llenado con el borrador guardado. Los cambios posteriores no afectarán el llenado hasta que publiques de nuevo."
        type="primary"
        confirm-text="Publicar"
        @confirm="confirmPublish"
        @cancel="publishDialog = false"
    />

    <ModalConfirmación
        v-model="revertDialog"
        title="¿Volver a la versión publicada?"
        message="Se descartarán los cambios del borrador y se restaurará la última versión publicada. Esta acción no se puede deshacer."
        type="warning"
        confirm-text="Restaurar"
        @confirm="confirmRevert"
        @cancel="revertDialog = false"
    />

    <ModalConfirmación
        v-model="deleteFormDialog"
        title="Eliminar formulario"
        message="El formulario se eliminará de la lista. Esta acción no se puede deshacer desde aquí."
        type="error"
        confirm-text="Eliminar"
        @confirm="confirmDeleteForm"
        @cancel="deleteFormDialog = false"
    />

    <ModalMensaje
        v-model="showErrorModal"
        title="No se pudo completar"
        :message="errorModalMessage"
        type="error"
        @confirm="showErrorModal = false"
    />

    <ModalMensaje
        v-model="showSuccessModal"
        :title="successModalTitle"
        :message="successModalMessage"
        type="success"
        @confirm="showSuccessModal = false"
    />
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import draggable from 'vuedraggable'
import FormBuilderSection from '@/components/formularios/FormBuilderSection.vue'
import ModalConfirmación from '@/components/common/ModalConfirmación.vue'
import ModalMensaje from '@/components/common/ModalMensaje.vue'
import {
    countFormFields,
    emptyRolePermissions,
    DEFAULT_FULL_PERM_ROLES,
    fieldTypeIcons,
    fieldTypeOptions,
    fillModeOptions,
    formPermissionOptions,
    fullRolePermissions,
    visibilidadInstanciasOptions,
} from '@/data/formulariosMock'
import { useAuthStore } from '@/stores/auth'
import { useFormulariosStore } from '@/stores/formularios'
import { useRolesStore } from '@/stores/roles'

const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()
const authStore = useAuthStore()
const rolesStore = useRolesStore()
const formulariosStore = useFormulariosStore()

const formulario = ref(null)
const loadError = ref(null)
const loadingForm = ref(true)

const formTitle = ref('')
const formHeaderDescription = ref('')
const formCategoria = ref(null)
const fillMode = ref('single')
const fillLimit = ref(1)
const visibilidadInstancias = ref('publico')
const auditoria = ref({ ultimoGuardado: null, ultimaPublicacion: null })
const sections = ref([])
const hasPublished = ref(false)
const publishedDefinition = ref(null)
const activeFieldId = ref(null)
const expandSectionId = ref(null)
const lastSectionId = ref(null)
const propertiesPanelRef = ref(null)
const categoriaPanelRef = ref(null)
const titleWrapRef = ref(null)
const titleFadeEnd = ref(false)
const titleFadeStart = ref(false)
let titleObserver = null

const sectionContextMenu = ref({ open: false, x: 0, y: 0, sectionId: null })
const editSectionDialog = ref({ open: false, sectionId: null, title: '', description: '' })
const deleteSectionDialog = ref({ open: false, sectionId: null })
const deleteFieldDialog = ref({ open: false, fieldId: null })
const rolePermissions = ref([])
const publishDialog = ref(false)
const revertDialog = ref(false)
const deleteFormDialog = ref(false)
const publishing = ref(false)
const reverting = ref(false)
const showErrorModal = ref(false)
const errorModalMessage = ref('')
const showSuccessModal = ref(false)
const successModalTitle = ref('Listo')
const successModalMessage = ref('')
const categoriaError = ref(false)
const saveStatus = ref('saved') // saved | dirty | saving
const suppressDirty = ref(false)
let saveDebounceTimer = null
let autosaveInterval = null
let savedSnapshot = ''

const categoriaOptions = [
    { value: 'historial', title: 'Historial clínico' },
    { value: 'encuesta', title: 'Encuesta' },
    { value: 'operativo', title: 'Operativo' },
]

const SUPER_ROLE_NAMES = new Set(['SUPERUSUARIO'])

const visibleCatalogRoles = computed(() => {
    const currentRole = String(authStore.user?.rol || '').toUpperCase()
    return (rolesStore.roles ?? []).filter((role) => {
        const name = String(role.nombre || '').toUpperCase()
        if (SUPER_ROLE_NAMES.has(name)) {
            return SUPER_ROLE_NAMES.has(currentRole)
        }
        return true
    })
})

const hasAnyFillPermission = computed(() =>
    rolePermissions.value.some((role) => role.canFill),
)

const isInSyncWithPublished = computed(() => {
    if (!hasPublished.value || !publishedDefinition.value) return false
    return (
        JSON.stringify({ sections: sections.value }) ===
        JSON.stringify(publishedDefinition.value)
    )
})

const canRevertToPublished = computed(
    () => hasPublished.value && !isInSyncWithPublished.value && !reverting.value,
)

const saveButtonLabel = computed(() => {
    if (saveStatus.value === 'saving') return 'Guardando…'
    if (saveStatus.value === 'saved') return 'Guardado'
    return 'Guardar'
})

const totalFields = computed(() => countFormFields({ sections: sections.value }))

function formatRoleName(nombre) {
    if (!nombre) return 'Rol'
    return String(nombre)
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatAuditDate(value) {
    if (!value) return ''
    try {
        return new Date(value).toLocaleString('es-BO', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
    } catch {
        return String(value)
    }
}

function defaultPermissionsForRole(nombre) {
    const name = String(nombre || '').toUpperCase()
    if (DEFAULT_FULL_PERM_ROLES.has(name)) {
        return { ...fullRolePermissions }
    }
    return { ...emptyRolePermissions }
}

function buildPayload() {
    return {
        titulo: formTitle.value?.trim() || 'Formulario sin título',
        descripcion: formHeaderDescription.value ?? '',
        categoria: formCategoria.value || null,
        fillMode: fillMode.value,
        fillLimit: fillMode.value === 'limited' ? (fillLimit.value || 1) : fillMode.value === 'single' ? 1 : null,
        visibilidadInstancias: visibilidadInstancias.value || 'publico',
        definicionBorrador: {
            sections: JSON.parse(JSON.stringify(sections.value)),
        },
        permisos: rolePermissions.value.map((role) => ({
            idRol: role.idRol,
            canView: Boolean(role.canView),
            canFill: Boolean(role.canFill),
            canEdit: Boolean(role.canEdit),
            canDelete: Boolean(role.canDelete),
        })),
    }
}

function currentSnapshot() {
    return JSON.stringify(buildPayload())
}

function markDirty() {
    if (suppressDirty.value) return
    if (currentSnapshot() === savedSnapshot) {
        saveStatus.value = 'saved'
        return
    }
    if (saveStatus.value !== 'saving') saveStatus.value = 'dirty'
    scheduleDebouncedSave()
}

function scheduleDebouncedSave() {
    clearTimeout(saveDebounceTimer)
    saveDebounceTimer = setTimeout(() => {
        if (saveStatus.value === 'dirty') saveNow()
    }, 2000)
}

async function saveNow() {
    if (!formulario.value?.id) return
    if (saveStatus.value === 'saving') return
    if (saveStatus.value === 'saved' && currentSnapshot() === savedSnapshot) return

    saveStatus.value = 'saving'
    try {
        const payload = buildPayload()
        const updated = await formulariosStore.save(formulario.value.id, payload)
        applyServerForm(updated, { preserveSelection: true })
        savedSnapshot = currentSnapshot()
        saveStatus.value = 'saved'
    } catch (err) {
        saveStatus.value = 'dirty'
        errorModalMessage.value = err.message || 'No se pudo guardar el formulario.'
        showErrorModal.value = true
    }
}

function syncRolePermissions(savedPermisos = null) {
    const previous = new Map(rolePermissions.value.map((role) => [role.idRol, role]))
    const savedMap = new Map(
        (savedPermisos ?? formulario.value?.permisos ?? []).map((p) => [p.idRol, p]),
    )

    rolePermissions.value = visibleCatalogRoles.value.map((role) => {
        const existing = previous.get(role.idRol)
        if (existing && !savedPermisos) {
            return { ...existing, nombre: role.nombre }
        }
        const saved = savedMap.get(role.idRol)
        if (saved) {
            return {
                idRol: role.idRol,
                nombre: role.nombre,
                canView: Boolean(saved.canView),
                canFill: Boolean(saved.canFill),
                canEdit: Boolean(saved.canEdit),
                canDelete: Boolean(saved.canDelete),
            }
        }
        return {
            idRol: role.idRol,
            nombre: role.nombre,
            ...defaultPermissionsForRole(role.nombre),
        }
    })
}

function toggleRolePermission(role, key, value) {
    role[key] = Boolean(value)

    if (key !== 'canView' && role[key]) {
        role.canView = true
    }

    if (key === 'canView' && !role.canView) {
        role.canFill = false
        role.canEdit = false
        role.canDelete = false
    }
    markDirty()
}

function applyServerForm(form, { preserveSelection = false } = {}) {
    suppressDirty.value = true
    formulario.value = form
    formTitle.value = form.titulo || form.formHeaderTitle || 'Formulario sin título'
    formHeaderDescription.value = form.descripcion || form.builderDescription || ''
    formCategoria.value = form.categoria ?? null
    fillMode.value = form.fillMode ?? 'single'
    fillLimit.value = form.fillLimit ?? 1
    visibilidadInstancias.value = form.visibilidadInstancias ?? 'publico'
    auditoria.value = form.auditoria ?? { ultimoGuardado: null, ultimaPublicacion: null }
    sections.value = JSON.parse(JSON.stringify(form.sections ?? form.definicionBorrador?.sections ?? []))
    hasPublished.value = Boolean(form.hasPublished || form.definicionPublicada)
    publishedDefinition.value = form.definicionPublicada
        ? JSON.parse(JSON.stringify(form.definicionPublicada))
        : null
    syncRolePermissions(form.permisos ?? [])

    if (!preserveSelection) {
        activeFieldId.value = sections.value?.[0]?.fields?.[0]?.id ?? null
        lastSectionId.value = sections.value?.[0]?.id ?? null
    }

    nextTick(() => {
        savedSnapshot = currentSnapshot()
        saveStatus.value = 'saved'
        suppressDirty.value = false
        updateTitleFade()
    })
}

async function loadFormulario() {
    loadingForm.value = true
    loadError.value = null
    try {
        const form = await formulariosStore.getById(route.params.id)
        applyServerForm(form)
    } catch (err) {
        formulario.value = null
        loadError.value = err.message || 'Formulario no encontrado'
    } finally {
        loadingForm.value = false
    }
}

const fieldTools = ref(
    fieldTypeOptions.map(({ value, title }) => ({
        label: title,
        icon: fieldTypeIcons[value],
        type: value,
    })),
)

function cloneFieldTool(tool) {
    return createField(tool.type)
}

const activeField = computed(() => {
    for (const section of sections.value) {
        const found = section.fields.find((f) => f.id === activeFieldId.value)
        if (found) return found
    }
    return null
})

const activeSectionTitle = computed(() => {
    for (const section of sections.value) {
        if (section.fields.some((f) => f.id === activeFieldId.value)) {
            return section.title
        }
    }
    return ''
})

const activeSectionId = computed(() => {
    for (const section of sections.value) {
        if (section.fields.some((f) => f.id === activeFieldId.value)) {
            return section.id
        }
    }
    return null
})

const deleteSectionMessage = computed(() => {
    const section = sections.value.find((s) => s.id === deleteSectionDialog.value.sectionId)
    if (!section) return '¿Eliminar esta sección?'
    return `¿Eliminar la sección "${section.title}" y sus ${section.fields.length} campos? Los cambios se aplicarán al guardar.`
})

const deleteFieldMessage = computed(() => {
    const field = activeField.value?.id === deleteFieldDialog.value.fieldId
        ? activeField.value
        : sections.value
            .flatMap((section) => section.fields)
            .find((f) => f.id === deleteFieldDialog.value.fieldId)

    if (!field) return '¿Eliminar esta pregunta?'

    const label = field.label?.trim() || 'Pregunta sin título'
    return `¿Eliminar la pregunta "${label}"? Los cambios se aplicarán al guardar.`
})

watch(fillMode, (mode) => {
    if (mode === 'single') fillLimit.value = 1
    if (mode === 'limited' && (!fillLimit.value || fillLimit.value < 1)) fillLimit.value = 1
    markDirty()
})

watch(fillLimit, () => markDirty())
watch(visibilidadInstancias, () => markDirty())
watch(formTitle, () => {
    updateTitleFade()
    markDirty()
})
watch(formHeaderDescription, () => markDirty())
watch(formCategoria, () => {
    categoriaError.value = false
    markDirty()
})
watch(sections, () => markDirty(), { deep: true })

watch(
    () => route.params.id,
    () => {
        loadFormulario()
    },
)

watch(mobile, () => updateTitleFade())
watch(visibleCatalogRoles, () => {
    suppressDirty.value = true
    syncRolePermissions()
    nextTick(() => {
        suppressDirty.value = false
        savedSnapshot = currentSnapshot()
    })
})

function getTitleInput() {
    return titleWrapRef.value?.querySelector('input')
}

function updateTitleFade() {
    nextTick(() => {
        const input = getTitleInput()
        if (!input) return
        titleFadeEnd.value = input.scrollWidth > input.clientWidth + 1
        titleFadeStart.value = input.scrollLeft > 1
    })
}

function onTitleScroll(event) {
    const input = event.target
    titleFadeStart.value = input.scrollLeft > 1
    titleFadeEnd.value = input.scrollLeft + input.clientWidth < input.scrollWidth - 1
}

function openPreview(version) {
    if (version === 'published' && !hasPublished.value) return
    router.push({
        path: `/formularios/${route.params.id}/preview`,
        query: { version },
    })
}

async function confirmPublish() {
    publishDialog.value = false
    if (!formCategoria.value) {
        categoriaError.value = true
        errorModalMessage.value = 'Debes elegir el tipo de formulario antes de publicar.'
        showErrorModal.value = true
        categoriaPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        return
    }

    publishing.value = true
    try {
        if (saveStatus.value === 'dirty') {
            await saveNow()
        }
        const updated = await formulariosStore.publish(formulario.value.id)
        applyServerForm(updated, { preserveSelection: true })
        successModalTitle.value = 'Formulario publicado'
        successModalMessage.value =
            'La versión de llenado se actualizó correctamente. Los pacientes y roles con permiso verán esta versión publicada.'
        showSuccessModal.value = true
    } catch (err) {
        errorModalMessage.value = err.message || 'No se pudo publicar.'
        showErrorModal.value = true
    } finally {
        publishing.value = false
    }
}

function openRevertDialog() {
    if (!canRevertToPublished.value) return
    revertDialog.value = true
}

async function confirmRevert() {
    revertDialog.value = false
    if (!formulario.value?.id || !hasPublished.value) return

    reverting.value = true
    try {
        const updated = await formulariosStore.revertToPublished(formulario.value.id)
        applyServerForm(updated, { preserveSelection: true })
        successModalTitle.value = 'Versión restaurada'
        successModalMessage.value =
            'El borrador volvió a la última versión publicada correctamente.'
        showSuccessModal.value = true
    } catch (err) {
        errorModalMessage.value = err.message || 'No se pudo restaurar la versión publicada.'
        showErrorModal.value = true
    } finally {
        reverting.value = false
    }
}

async function confirmDeleteForm() {
    deleteFormDialog.value = false
    try {
        await formulariosStore.remove(formulario.value.id)
        router.push('/formularios')
    } catch (err) {
        errorModalMessage.value = err.message || 'No se pudo eliminar.'
        showErrorModal.value = true
    }
}

onMounted(() => {
    if (!rolesStore.roles.length) {
        rolesStore.fetchRoles()
    }
    loadFormulario()
    updateTitleFade()
    const input = getTitleInput()
    input?.addEventListener('scroll', onTitleScroll)
    if (titleWrapRef.value && typeof ResizeObserver !== 'undefined') {
        titleObserver = new ResizeObserver(updateTitleFade)
        titleObserver.observe(titleWrapRef.value)
    }
    autosaveInterval = setInterval(() => {
        if (saveStatus.value === 'dirty') saveNow()
    }, 30000)
})

onUnmounted(() => {
    getTitleInput()?.removeEventListener('scroll', onTitleScroll)
    titleObserver?.disconnect()
    clearTimeout(saveDebounceTimer)
    clearInterval(autosaveInterval)
})

function selectField(fieldId) {
    activeFieldId.value = fieldId
    const section = sections.value.find((s) => s.fields.some((f) => f.id === fieldId))
    if (section) lastSectionId.value = section.id
    nextTick(() => {
        propertiesPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
}

function onActiveFieldTypeChange(type) {
    if (!activeField.value) return
    if ((type === 'single_choice' || type === 'multiple_choice') && !activeField.value.options?.length) {
        activeField.value.options = ['Opción 1', 'Opción 2']
    }
}

function addActiveFieldOption() {
    if (!activeField.value) return
    if (!activeField.value.options) activeField.value.options = []
    activeField.value.options.push('')
}

function removeActiveFieldOption(index) {
    activeField.value?.options?.splice(index, 1)
}

function openSectionContextMenu(event, section) {
    sectionContextMenu.value = {
        open: true,
        x: event.clientX,
        y: event.clientY,
        sectionId: section.id,
    }
}

function closeSectionContextMenu() {
    sectionContextMenu.value.open = false
}

function openEditSectionDialog() {
    const section = sections.value.find((s) => s.id === sectionContextMenu.value.sectionId)
    if (!section) return
    editSectionDialog.value = {
        open: true,
        sectionId: section.id,
        title: section.title,
        description: section.description ?? '',
    }
    closeSectionContextMenu()
}

function saveSectionEdit() {
    const section = sections.value.find((s) => s.id === editSectionDialog.value.sectionId)
    if (!section) return
    section.title = editSectionDialog.value.title.trim() || 'Sección sin título'
    section.description = editSectionDialog.value.description
    editSectionDialog.value.open = false
}

function openDeleteSectionDialog() {
    deleteSectionDialog.value = {
        open: true,
        sectionId: sectionContextMenu.value.sectionId,
    }
    closeSectionContextMenu()
}

function confirmDeleteSection() {
    const sectionId = deleteSectionDialog.value.sectionId
    const index = sections.value.findIndex((s) => s.id === sectionId)
    if (index === -1) return

    const section = sections.value[index]
    if (section.fields.some((f) => f.id === activeFieldId.value)) {
        activeFieldId.value = null
    }

    sections.value.splice(index, 1)
    deleteSectionDialog.value.open = false
}

function openDeleteFieldDialog(fieldId) {
    deleteFieldDialog.value = {
        open: true,
        fieldId,
    }
}

function confirmDeleteField() {
    const fieldId = deleteFieldDialog.value.fieldId
    if (!fieldId) return

    for (const section of sections.value) {
        const index = section.fields.findIndex((f) => f.id === fieldId)
        if (index === -1) continue

        section.fields.splice(index, 1)
        if (activeFieldId.value === fieldId) {
            activeFieldId.value = null
        }
        break
    }

    deleteFieldDialog.value.open = false
}

let fieldCounter = 0

function generateFieldId() {
    fieldCounter++
    return `new-field-${Date.now()}-${fieldCounter}`
}

function createField(type = 'short_text') {
    const id = generateFieldId()
    return {
        id,
        label: '',
        type,
        required: false,
        options: (type === 'single_choice' || type === 'multiple_choice') ? ['Opción 1', 'Opción 2'] : [],
        helpText: '',
    }
}

function addFieldToSection(sectionId) {
    const section = sections.value.find((s) => s.id === sectionId)
    if (!section) return
    const newField = createField('short_text')
    section.fields.push(newField)
    lastSectionId.value = sectionId
    expandSectionId.value = sectionId
    activeFieldId.value = newField.id
}

function addFieldToActiveSection(type = 'short_text') {
    const targetSection =
        sections.value.find((s) => s.id === activeSectionId.value)
        || sections.value.find((s) => s.id === lastSectionId.value)
        || sections.value[0]

    if (!targetSection) return

    const newField = createField(type)
    targetSection.fields.push(newField)
    lastSectionId.value = targetSection.id
    expandSectionId.value = targetSection.id
    activeFieldId.value = newField.id
}

function addSection() {
    const id = `section-${Date.now()}`
    const newSection = {
        id,
        title: 'Nueva sección',
        description: '',
        fields: [],
    }
    sections.value.push(newSection)
    lastSectionId.value = id
    nextTick(() => {
        scrollToSection(id)
    })
}

function scrollToSection(sectionId) {
    expandSectionId.value = sectionId
    nextTick(() => {
        const el = document.getElementById(`section-${sectionId}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
}
</script>

<style scoped>
.builder-shell {
    margin: -24px;
    height: calc(100vh - 75px - 48px);
    max-height: calc(100vh - 75px - 48px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f1f5f9;
}

@media (max-width: 960px) {
    .builder-shell {
        margin: -8px;
        height: calc(100vh - 56px - 16px);
        max-height: calc(100vh - 56px - 16px);
    }
}

.builder-header {
    position: sticky;
    top: 0;
    z-index: 10;
    flex-shrink: 0;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.builder-workspace {
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
}

.builder-canvas {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    background: #f8fafc;
}

.builder-canvas-inner {
    max-width: 800px;
    padding-bottom: 80px;
}

.builder-sidebar {
    flex: 0 0 360px;
    width: 360px;
    min-height: 0;
    overflow: hidden;
    background: white;
    border-left: 1px solid #e2e8f0;
    box-shadow: -4px 0 12px rgba(0, 0, 0, 0.02);
}

.builder-sidebar-scroll {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
}

.border-b {
    border-bottom: 1px solid #e2e8f0;
}

.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12) !important;
}

.premium-card {
    background-color: white;
}

.form-header-card {
    overflow: hidden;
}

.section-badge {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    border-radius: 24px 24px 0 0;
    pointer-events: none;
    z-index: 1;
}

.section-badge.primary {
    background-color: rgb(var(--v-theme-primary));
}

.builder-title-field-wrap {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    max-width: 400px;
}

.builder-title-field-wrap--mobile {
    max-width: 180px;
}

.builder-title-field-wrap.fade-end::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 28px;
    background: linear-gradient(to right, rgba(255, 255, 255, 0), #fff);
    pointer-events: none;
    z-index: 1;
}

.builder-title-field-wrap.fade-start::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 28px;
    background: linear-gradient(to left, rgba(255, 255, 255, 0), #fff);
    pointer-events: none;
    z-index: 1;
}

.builder-title-field {
    width: 100%;
}

.builder-title-field :deep(.v-field__input) {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    padding-top: 0;
    overflow-x: auto;
    white-space: nowrap;
    text-overflow: clip;
    scrollbar-width: none;
}

.builder-title-field :deep(.v-field__input::-webkit-scrollbar) {
    display: none;
}

.form-header-fields {
    overflow: visible;
}

.form-header-title,
.form-header-description {
    width: 100%;
}

.form-header-title :deep(.v-input__control),
.form-header-description :deep(.v-input__control),
.form-header-title :deep(.v-field__field),
.form-header-description :deep(.v-field__field) {
    overflow: visible;
}

.form-header-title :deep(.v-field),
.form-header-description :deep(.v-field) {
    height: auto;
    min-height: 0;
    align-items: flex-start;
}

.form-header-title :deep(.v-field__input),
.form-header-description :deep(.v-field__input) {
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    overflow: visible;
    height: auto !important;
    min-height: 0;
    field-sizing: content;
    -webkit-mask-image: none !important;
    mask-image: none !important;
}

.form-header-title :deep(textarea),
.form-header-description :deep(textarea) {
    opacity: 1 !important;
}

.form-header-title :deep(.v-field__input) {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
    color: #1e293b;
    padding: 0;
}

.form-header-description :deep(.v-field__input) {
    font-size: 1rem;
    line-height: 1.5;
    color: #64748b;
    padding: 0;
}

.field-tools-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
}

.field-tool-item {
    width: 100%;
    cursor: grab;
}

.field-tool-item:active {
    cursor: grabbing;
}

.field-tool-btn {
    width: 100%;
    height: auto !important;
    min-height: 72px;
    padding: 12px 6px !important;
    flex-direction: column;
    pointer-events: none;
}

.field-tool-btn :deep(.v-btn__content) {
    white-space: normal;
    line-height: 1.2;
}

.fill-mode-panel :deep(.v-selection-control) {
    align-items: flex-start;
}

.role-permissions-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) repeat(4, 36px);
    align-items: center;
    column-gap: 2px;
    min-height: 36px;
}

.role-permissions-grid--head {
    margin-bottom: 4px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e2e8f0;
}

.role-permission-check {
    margin: 0;
    justify-self: center;
}

.role-permission-check :deep(.v-selection-control) {
    min-height: 32px;
    justify-content: center;
}

.role-permission-check :deep(.v-label) {
    display: none;
}

.fill-mode-radio-group :deep(.v-label) {
    opacity: 1;
}

.section-index-btn {
    min-height: 36px;
    text-transform: none;
}

.section-index-btn--active {
    background: rgba(var(--v-theme-primary), 0.08);
}

.section-context-overlay {
    position: fixed;
    inset: 0;
    z-index: 2400;
}

.section-context-menu {
    position: fixed;
    min-width: 200px;
    z-index: 2401;
}

.max-width-form {
    max-width: 1200px;
}

.min-width-0 {
    min-width: 0;
}

.section-drag-ghost {
    opacity: 0.4;
    background: #e3f2fd;
    border-radius: 16px;
}

.section-index-ghost {
    opacity: 0.4;
    background: rgba(var(--v-theme-primary), 0.1);
    border-radius: 8px;
}
</style>
