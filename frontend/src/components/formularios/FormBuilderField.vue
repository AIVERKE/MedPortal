<template>
    <v-card
        class="mb-4 rounded-xl question-card"
        :class="{ 'question-card--active': active }"
        border
        @click="$emit('select')"
    >
        <v-card-text class="pa-5">
            <div class="d-flex align-center ga-1 mb-3 field-toolbar">
                <v-icon class="drag-handle" size="22" color="grey">mdi-drag</v-icon>
                <span class="text-caption text-grey-darken-1 drag-hint">Arrastrar</span>
                <v-spacer />
                <v-btn
                    class="no-drag"
                    icon="mdi-arrow-up"
                    variant="text"
                    color="grey"
                    size="x-small"
                    :disabled="!canMoveUp"
                    @click.stop="$emit('move-up')"
                />
                <v-btn
                    class="no-drag"
                    icon="mdi-arrow-down"
                    variant="text"
                    color="grey"
                    size="x-small"
                    :disabled="!canMoveDown"
                    @click.stop="$emit('move-down')"
                />
            </div>
            <div class="d-flex flex-column flex-sm-row align-sm-start justify-space-between ga-4 mb-4">
                <v-text-field
                    v-model="field.label"
                    variant="plain"
                    density="compact"
                    hide-details
                    placeholder="Etiqueta del campo"
                    class="question-label flex-grow-1"
                    @click.stop
                />
                <v-select
                    v-model="field.type"
                    :items="fieldTypeOptions"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    density="compact"
                    hide-details
                    rounded="lg"
                    :prepend-inner-icon="fieldTypeIcon"
                    class="question-type-select"
                    style="max-width: 210px;"
                    @update:model-value="onTypeChange"
                    @click.stop
                />
            </div>

            <!-- Preview by type -->
            <v-text-field
                v-if="field.type === 'short_text' || field.type === 'number'"
                :placeholder="previewPlaceholder"
                variant="plain"
                density="comfortable"
                hide-details
                disabled
                class="question-preview mb-4"
            />

            <v-textarea
                v-else-if="field.type === 'long_text'"
                :placeholder="previewPlaceholder"
                variant="plain"
                density="comfortable"
                hide-details
                rows="3"
                disabled
                class="question-preview mb-4"
            />

            <v-text-field
                v-else-if="field.type === 'date'"
                placeholder="dd/mm/aaaa"
                variant="plain"
                density="comfortable"
                hide-details
                disabled
                prepend-inner-icon="mdi-calendar"
                class="question-preview mb-4"
            />

            <div v-else-if="field.type === 'single_choice'" class="d-flex flex-column ga-2 mb-4">
                <div
                    v-for="(option, index) in field.options"
                    :key="index"
                    class="d-flex align-center ga-3 option-row"
                >
                    <v-icon color="grey-lighten-1" size="20">mdi-radiobox-blank</v-icon>
                    <v-text-field
                        v-model="field.options[index]"
                        variant="plain"
                        density="compact"
                        hide-details
                        placeholder="Opción"
                        class="flex-grow-1"
                        @click.stop
                    />
                    <v-btn
                        icon="mdi-close"
                        variant="text"
                        color="grey-lighten-1"
                        size="x-small"
                        class="option-remove"
                        @click.stop="removeOption(index)"
                    />
                </div>
                <v-btn
                    variant="text"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-plus"
                    class="text-none align-self-start"
                    @click.stop="addOption"
                >
                    Añadir opción
                </v-btn>
            </div>

            <div v-else-if="field.type === 'multiple_choice'" class="mb-4">
                <div
                    v-for="(option, index) in field.options"
                    :key="index"
                    class="d-flex align-center ga-2 mb-2 option-row"
                >
                    <v-checkbox-btn color="primary" disabled hide-details />
                    <v-text-field
                        v-model="field.options[index]"
                        variant="plain"
                        density="compact"
                        hide-details
                        placeholder="Opción"
                        class="flex-grow-1"
                        @click.stop
                    />
                    <v-btn
                        icon="mdi-close"
                        variant="text"
                        color="grey-lighten-1"
                        size="x-small"
                        class="option-remove"
                        @click.stop="removeOption(index)"
                    />
                </div>
                <v-btn
                    variant="text"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-plus"
                    class="text-none"
                    @click.stop="addOption"
                >
                    Añadir opción
                </v-btn>
            </div>

            <v-textarea
                v-model="field.helpText"
                variant="plain"
                density="compact"
                hide-details
                auto-grow
                rows="1"
                no-resize
                placeholder="Texto de ayuda (opcional)"
                class="help-text-field mb-3"
                @click.stop
            />

            <v-divider class="mb-3" />
            <div class="d-flex align-center justify-end ga-4 no-drag" @click.stop>
                <v-switch
                    v-model="field.required"
                    label="Obligatoria"
                    color="primary"
                    density="compact"
                    hide-details
                    inset
                />
                <v-menu location="bottom end">
                    <template #activator="{ props: menuProps }">
                        <v-btn
                            v-bind="menuProps"
                            icon="mdi-dots-vertical"
                            variant="text"
                            color="grey-darken-1"
                            size="small"
                        />
                    </template>
                    <v-list density="compact" min-width="180">
                        <v-list-item
                            prepend-icon="mdi-delete-outline"
                            title="Eliminar pregunta"
                            class="text-error"
                            rounded="lg"
                            @click="$emit('delete')"
                        />
                    </v-list>
                </v-menu>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { fieldTypeIcons, fieldTypeOptions } from '@/data/formulariosMock'

const props = defineProps({
    field: { type: Object, required: true },
    active: { type: Boolean, default: false },
    canMoveUp: { type: Boolean, default: false },
    canMoveDown: { type: Boolean, default: false },
})

defineEmits(['select', 'move-up', 'move-down', 'delete'])

const fieldTypeIcon = computed(() => fieldTypeIcons[props.field.type] ?? 'mdi-form-select')

const previewPlaceholder = computed(() => {
    const map = {
        short_text: 'Respuesta de texto corto',
        long_text: 'Respuesta de texto largo',
        number: 'Valor numérico',
    }
    return map[props.field.type] ?? 'Respuesta'
})

function onTypeChange(type) {
    if ((type === 'single_choice' || type === 'multiple_choice') && !props.field.options?.length) {
        props.field.options = ['Opción 1', 'Opción 2']
    }
}

function addOption() {
    if (!props.field.options) props.field.options = []
    props.field.options.push('')
}

function removeOption(index) {
    props.field.options.splice(index, 1)
}
</script>

<style scoped>
.question-card {
    background: white;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
    cursor: grab;
    overflow: visible;
}

.question-card:active {
    cursor: grabbing;
}

.question-card:hover {
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.1) !important;
}

.question-card--active {
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.1) !important;
}

.question-label :deep(.v-field__input) {
    font-size: 1.05rem;
    font-weight: 600;
    color: #1e293b;
    padding: 0;
}

.question-preview :deep(.v-field__input) {
    border-bottom: 1px dashed #cbd5e1;
    color: #94a3b8;
    padding-bottom: 8px;
}

.help-text-field :deep(.v-field__input) {
    font-size: 0.8125rem;
    color: #64748b;
    padding: 0;
    -webkit-mask-image: none !important;
    mask-image: none !important;
}

.help-text-field :deep(textarea) {
    opacity: 1 !important;
}

.option-row:hover .option-remove {
    opacity: 1;
}

.option-remove {
    opacity: 0;
    transition: opacity 0.15s ease;
}

.drag-handle {
    cursor: grab;
    opacity: 0.7;
}

.drag-handle:active {
    cursor: grabbing;
}

.drag-hint {
    opacity: 0.55;
    user-select: none;
}

.field-toolbar {
    margin: -8px -8px 0 -8px;
    min-height: 28px;
}

.no-drag {
    cursor: default;
}
</style>
