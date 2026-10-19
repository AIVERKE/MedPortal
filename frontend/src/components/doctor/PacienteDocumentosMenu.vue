<template>
    <v-menu
        v-if="canOpen"
        v-model="menuOpen"
        location="bottom end"
        :close-on-content-click="false"
        max-width="360"
    >
        <template #activator="{ props: menuProps }">
            <v-btn
                v-bind="menuProps"
                variant="tonal"
                color="primary"
                rounded="lg"
                size="large"
                prepend-icon="mdi-folder-open-outline"
                class="text-none font-weight-bold w-100"
            >
                Documentos
            </v-btn>
        </template>

        <v-card rounded="lg" min-width="280">
            <v-card-title class="text-subtitle-1 font-weight-bold py-3 px-4">
                Documentos del paciente
            </v-card-title>
            <v-divider />

            <v-list density="compact" class="py-2">
                <template v-for="(section, index) in sections" :key="section.tipo">
                    <v-divider v-if="index > 0" class="my-1" />
                    <v-list-subheader class="text-uppercase font-weight-bold" :class="section.textClass">
                        {{ section.title }}
                    </v-list-subheader>

                    <template v-if="section.items.length">
                        <v-list-item
                            v-for="item in section.items"
                            :key="item.key"
                            :href="item.url || undefined"
                            :target="item.url ? '_blank' : undefined"
                            rel="noopener noreferrer"
                            :disabled="!item.url"
                            :prepend-icon="item.icon"
                            :title="item.label"
                            :subtitle="item.subtitle"
                            rounded="lg"
                            class="mx-2"
                        />
                    </template>
                    <v-list-item v-else class="text-disabled mx-2" disabled>
                        <v-list-item-title class="text-caption">
                            {{ section.emptyText }}
                        </v-list-item-title>
                    </v-list-item>
                </template>
            </v-list>
        </v-card>
    </v-menu>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    paciente: { type: Object, default: null }
})

const menuOpen = ref(false)

const hasRole = (tipo) => props.paciente?.roles?.some((r) => r.tipo === tipo) ?? false

const esEstudiante = computed(() =>
    hasRole('estudiante') || props.paciente?.esEstudiante === true
)

const esConsultor = computed(() =>
    hasRole('consultor') || props.paciente?.esConsultor === true
)

const canOpen = computed(() => esEstudiante.value || esConsultor.value)

const formatDate = (value) => {
    if (!value) return null
    return String(value).slice(0, 10)
}

const sections = computed(() => {
    const p = props.paciente
    const result = []

    if (esEstudiante.value) {
        const estudianteItems = []
        if (p?.documentoMatriculaUrl) {
            estudianteItems.push({
                key: 'matricula',
                label: 'Matrícula',
                url: p.documentoMatriculaUrl,
                icon: 'mdi-file-pdf-box'
            })
        }
        if (p?.documentoCarnetUrl) {
            estudianteItems.push({
                key: 'carnet',
                label: 'Carnet',
                url: p.documentoCarnetUrl,
                icon: 'mdi-card-account-details'
            })
        }
        result.push({
            tipo: 'estudiante',
            title: 'Estudiante',
            textClass: 'text-yellow-darken-3',
            items: estudianteItems,
            emptyText: 'Sin documentos disponibles'
        })
    }

    if (esConsultor.value) {
        const contratos = Array.isArray(p?.contratos) ? p.contratos : []
        const consultorItems = contratos.map((contrato, index) => {
            const inicio = formatDate(contrato.fechaInicioContrato)
            const fin = formatDate(contrato.fechaFinContrato)
            const dates = [inicio, fin].filter(Boolean).join(' - ')
            const subtitleParts = [contrato.unidad, dates].filter(Boolean)
            return {
                key: contrato.idContratoConsultor || `contrato-${index}`,
                label: contrato.cargo || `Contrato ${index + 1}`,
                subtitle: subtitleParts.join(' · ') || undefined,
                url: contrato.documentoContratoUrl || null,
                icon: 'mdi-file-certificate-outline'
            }
        })
        result.push({
            tipo: 'consultor',
            title: 'Consultor',
            textClass: 'text-light-green-darken-2',
            items: consultorItems,
            emptyText: 'Sin contratos registrados'
        })
    }

    return result
})
</script>
