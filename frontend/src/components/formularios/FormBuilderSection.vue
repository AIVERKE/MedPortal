<template>
    <v-card
        :id="`section-${section.id}`"
        class="mb-6 rounded-xl shadow-premium premium-card position-relative form-section-card"
        :class="{ 'form-section-card--collapsed': collapsed }"
        border
    >
        <div class="section-badge primary"></div>
        <div class="section-drag-handle d-flex align-center justify-center">
            <v-icon size="18" color="grey-lighten-1">mdi-drag-horizontal</v-icon>
        </div>
        <v-card-text class="pa-6 pa-md-7">
            <div class="d-flex align-start justify-space-between ga-3">
                <div class="flex-grow-1 min-width-0">
                    <v-text-field
                        v-model="section.title"
                        variant="plain"
                        density="compact"
                        hide-details
                        placeholder="Título de la sección"
                        class="section-title-field"
                    />
                    <v-textarea
                        v-if="!collapsed"
                        v-model="section.description"
                        variant="plain"
                        density="compact"
                        hide-details
                        auto-grow
                        rows="1"
                        no-resize
                        placeholder="Descripción de la sección (opcional)"
                        class="section-description-field mt-1"
                    />
                </div>
                <div class="d-flex align-center ga-2 flex-shrink-0">
                    <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
                        {{ section.fields.length }} campos
                    </v-chip>
                    <v-btn
                        :icon="collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                        variant="text"
                        color="grey-darken-1"
                        size="small"
                        class="no-drag"
                        :aria-label="collapsed ? 'Expandir sección' : 'Colapsar sección'"
                        @click="collapsed = !collapsed"
                    />
                </div>
            </div>

            <div v-show="!collapsed">
                <v-divider class="my-4" />

                <draggable
                    v-model="section.fields"
                    group="fields"
                    item-key="id"
                    class="fields-draggable"
                    ghost-class="drag-ghost"
                    chosen-class="drag-chosen"
                    drag-class="drag-dragging"
                    animation="200"
                    :force-fallback="true"
                    :fallback-tolerance="3"
                    :distance="6"
                    filter=".no-drag, .v-field, .v-input, .v-btn, .v-switch, .v-selection-control, .v-menu, input, textarea, select, button, .v-overlay"
                    :prevent-on-filter="false"
                >
                    <template #item="{ element, index }">
                        <FormBuilderField
                            :field="element"
                            :active="activeFieldId === element.id"
                            :can-move-up="index > 0"
                            :can-move-down="index < section.fields.length - 1"
                            @select="$emit('select-field', element.id)"
                            @move-up="moveField(index, -1)"
                            @move-down="moveField(index, 1)"
                            @delete="$emit('delete-field', element.id)"
                        />
                    </template>
                </draggable>

                <v-btn
                    variant="tonal"
                    color="primary"
                    rounded="lg"
                    prepend-icon="mdi-plus"
                    class="text-none font-weight-bold mt-2"
                    block
                    @click="$emit('add-field', section.id)"
                >
                    Añadir campo a esta sección
                </v-btn>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import FormBuilderField from './FormBuilderField.vue'

const props = defineProps({
    section: { type: Object, required: true },
    activeFieldId: { type: String, default: null },
    preferExpanded: { type: Boolean, default: false },
})

defineEmits(['select-field', 'add-field', 'delete-field'])

const collapsed = ref(false)

watch(
    () => props.activeFieldId,
    (fieldId) => {
        if (!fieldId) return
        if (props.section.fields.some((f) => f.id === fieldId)) {
            collapsed.value = false
        }
    },
)

watch(
    () => props.preferExpanded,
    (prefer) => {
        if (prefer) collapsed.value = false
    },
)

function moveField(index, direction) {
    const newIndex = index + direction
    const fields = props.section.fields
    const [moved] = fields.splice(index, 1)
    fields.splice(newIndex, 0, moved)
}
</script>

<style scoped>
.shadow-premium {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.12) !important;
}

.premium-card {
    background-color: white;
}

.form-section-card {
    overflow: hidden;
}

.form-section-card--collapsed {
    transition: box-shadow 0.2s ease;
}

.section-badge {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    border-radius: 24px 24px 0 0;
    pointer-events: none;
}

.section-badge.primary {
    background-color: rgb(var(--v-theme-primary));
}

.section-title-field :deep(.v-field__input) {
    font-size: 1.125rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgb(var(--v-theme-primary));
    padding: 0;
}

.section-description-field :deep(.v-field__input) {
    font-size: 0.875rem;
    color: #64748b;
    padding: 0;
    white-space: pre-wrap;
    word-break: break-word;
    -webkit-mask-image: none !important;
    mask-image: none !important;
}

.section-description-field :deep(textarea) {
    opacity: 1 !important;
}

.min-width-0 {
    min-width: 0;
}

.section-drag-handle {
    cursor: grab;
    height: 20px;
    opacity: 0;
    transition: opacity 0.15s ease;
    margin-top: 4px;
}

.section-drag-handle:active {
    cursor: grabbing;
}

.form-section-card:hover .section-drag-handle {
    opacity: 1;
}

.fields-draggable {
    min-height: 8px;
}

.drag-ghost {
    opacity: 0.45;
}

.drag-chosen {
    cursor: grabbing !important;
}

.drag-dragging {
    opacity: 0.9;
    box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.2) !important;
}
</style>
