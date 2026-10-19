<script setup>
import { computed, ref, watch } from 'vue'
import { resolveUploadUrl } from '@/utils/uploadUrl'

const props = defineProps({
    foto: {
        type: String,
        default: null,
    },
    nombres: {
        type: String,
        default: '',
    },
    primerApellido: {
        type: String,
        default: '',
    },
    size: {
        type: [Number, String],
        default: 40,
    },
    rounded: {
        type: [String, Number, Boolean],
        default: 'circle',
    },
    color: {
        type: String,
        default: 'primary',
    },
})

const resolvedFoto = computed(() => resolveUploadUrl(props.foto))
const imageFailed = ref(false)

watch(resolvedFoto, () => {
    imageFailed.value = false
})

const showPhoto = computed(() => Boolean(resolvedFoto.value) && !imageFailed.value)

const initials = computed(() => {
    const n = props.nombres?.trim() || ''
    const a = props.primerApellido?.trim() || ''

    if (n && a) {
        return `${n.charAt(0)}${a.charAt(0)}`.toUpperCase()
    }

    if (n) {
        const parts = n.split(/\s+/).filter(Boolean)
        if (parts.length >= 2) {
            return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
        }
        return n.slice(0, 2).toUpperCase()
    }

    if (a) return a.slice(0, 2).toUpperCase()
    return '??'
})

const onImageError = () => {
    imageFailed.value = true
}
</script>

<template>
    <v-avatar v-if="showPhoto" :size="size" :rounded="rounded">
        <v-img
            :src="resolvedFoto"
            cover
            alt="Foto de perfil"
            @error="onImageError"
        />
    </v-avatar>
    <v-avatar
        v-else
        :color="color"
        variant="tonal"
        :size="size"
        :rounded="rounded"
        class="persona-avatar-fallback"
    >
        <span class="persona-avatar-fallback__initials">{{ initials }}</span>
    </v-avatar>
</template>

<style scoped>
.persona-avatar-fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.persona-avatar-fallback__initials {
    line-height: 1;
    letter-spacing: 0.02em;
    font-weight: 700;
    font-size: 0.875rem;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}
</style>
