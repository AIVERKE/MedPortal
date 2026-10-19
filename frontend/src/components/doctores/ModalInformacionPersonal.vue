<template>

    <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="700"

        persistent scrollable class="rounded-xl">

        <v-card class="rounded-xl overflow-hidden shadow-premium">

            <!-- Header -->

            <v-card-title class="pa-0">

                <v-toolbar color="primary" flat dark height="auto" min-height="64" class="py-2 px-1">

                    <v-icon start class="ms-4">mdi-account-edit</v-icon>

                    <div class="text-h6 font-weight-bold text-wrap flex-grow-1 ms-2 me-2">

                        Editar Información Personal

                    </div>

                    <v-spacer class="hidden-xs"></v-spacer>

                    <v-btn icon="mdi-close" variant="text" @click="close" class="ms-auto"></v-btn>

                </v-toolbar>

            </v-card-title>



            <v-card-text class="pa-6 pa-md-8 bg-slate-50">

                <v-form ref="formRef" lazy-validation @submit.prevent="handleSave">

                    <p class="text-subtitle-2 text-medium-emphasis mb-6">

                        Modifica los datos personales. Estos cambios afectarán a su perfil global en el sistema.

                    </p>



                    <v-row>

                        <!-- Nombres -->

                        <v-col cols="12" sm="4">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-account-outline</v-icon>

                                <span>Nombres</span>

                            </div>

                            <v-text-field v-model="form.nombres" label="Nombres" variant="outlined" rounded="lg"

                                bg-color="white" placeholder="Juan"

                                :rules="[v => !!v || 'Los nombres son requeridos']" />

                        </v-col>



                        <!-- Primer Apellido -->

                        <v-col cols="12" sm="4">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-account-outline</v-icon>

                                <span>Primer Apellido</span>

                            </div>

                            <v-text-field v-model="form.primerApellido" label="Primer Apellido" variant="outlined"

                                rounded="lg" bg-color="white" placeholder="Pérez"

                                :rules="[v => !!v || 'El primer apellido es requerido']" />

                        </v-col>



                        <!-- Segundo Apellido -->

                        <v-col cols="12" sm="4">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-account-outline</v-icon>

                                <span>Segundo Apellido</span>

                            </div>

                            <v-text-field v-model="form.segundoApellido" label="Segundo Apellido" variant="outlined"

                                rounded="lg" bg-color="white" placeholder="Gómez" />

                        </v-col>



                        <!-- CI -->

                        <v-col cols="12" sm="6">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-card-account-details-outline</v-icon>

                                <span>Cédula de Identidad</span>

                            </div>

                            <v-text-field v-model="form.ci" label="C.I." variant="outlined" rounded="lg"

                                bg-color="white" placeholder="Ej: 1234567-1A"

                                :rules="[v => !!v || 'El C.I. es requerido']" />

                        </v-col>



                        <!-- Género -->

                        <v-col cols="12" sm="6">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-gender-male-female</v-icon>

                                <span>Género</span>

                            </div>

                            <v-select v-model="form.genero" :items="['M', 'F', 'Otro']" label="Género"

                                variant="outlined" rounded="lg" bg-color="white"

                                :rules="[v => !!v || 'El género es requerido']" />

                        </v-col>



                        <!-- Fecha de Nacimiento -->

                        <v-col cols="12" sm="6">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-calendar-range</v-icon>

                                <span>Fecha de Nacimiento</span>

                            </div>

                            <v-text-field v-model="form.fechaNacimiento" label="Fecha Nac." type="date"

                                variant="outlined" rounded="lg" bg-color="white" />

                        </v-col>



                        <!-- Celular -->

                        <v-col cols="12" sm="6">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-cellphone</v-icon>

                                <span>Celular</span>

                            </div>

                            <v-text-field v-model="form.celular" label="Celular" variant="outlined" rounded="lg"

                                bg-color="white" placeholder="Ej: 70012345" />

                        </v-col>



                        <!-- Email -->

                        <v-col cols="12">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-email-outline</v-icon>

                                <span>Correo Electrónico</span>

                            </div>

                            <v-text-field v-model="form.email" label="Email" variant="outlined" rounded="lg"

                                bg-color="white" placeholder="ejemplo@correo.com"

                                :rules="[v => !v || /.+@.+\..+/.test(v) || 'E-mail debe ser válido']" />

                        </v-col>



                        <!-- Dirección -->

                        <v-col cols="12">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-map-marker-outline</v-icon>

                                <span>Dirección de Domicilio</span>

                            </div>

                            <v-textarea v-model="form.direccion" label="Dirección" variant="outlined" rounded="lg"

                                bg-color="white" rows="2" placeholder="Calle, número, zona..." />

                        </v-col>



                        <!-- Foto de perfil -->

                        <v-col cols="12">

                            <div class="section-title mb-2">

                                <v-icon size="16" class="me-2" color="primary">mdi-image-outline</v-icon>

                                <span>Foto de perfil (opcional)</span>

                            </div>

                            <div class="d-flex align-center ga-4 flex-wrap mb-3">

                                <v-avatar size="72" class="border">

                                    <v-img :src="photoPreviewSrc" cover alt="Vista previa de foto" />

                                </v-avatar>

                                <div class="text-caption text-medium-emphasis">

                                    JPG, PNG o WEBP. Máximo 2MB.

                                </div>

                            </div>

                            <v-file-input v-model="selectedPhoto" accept="image/jpeg,image/png,image/webp"

                                prepend-icon="mdi-camera" label="Seleccionar foto de perfil" variant="outlined"

                                rounded="lg" bg-color="white" clearable hide-details="auto"

                                :rules="[optionalPhotoRule]" />

                        </v-col>

                    </v-row>

                </v-form>

            </v-card-text>



            <v-divider />



            <!-- Actions -->

            <v-card-actions class="pa-6 d-flex gap-3">

                <v-btn variant="text" color="grey-darken-1" rounded="xl" class="text-none font-weight-bold flex-grow-1"

                    size="large" @click="close">

                    Cancelar

                </v-btn>

                <v-btn color="primary" variant="flat" rounded="xl" class="text-none font-weight-bold flex-grow-1"

                    size="large" elevation="4" @click="handleSave" :loading="loading">

                    Guardar Cambios

                </v-btn>

            </v-card-actions>

        </v-card>

        <!-- Feedback UI -->

        <ModalMensaje v-model="msgShow" :title="msgTitle" :message="msgContent" :type="msgType"

            @confirm="handleMsgConfirm" />

    </v-dialog>

</template>



<script setup>

import { ref, watch, computed } from 'vue';

import { usePersonasStore } from '@/stores/personas';

import { resolveUploadUrl } from '@/utils/uploadUrl';

import defaultAvatar from '@/assets/usuario_default.webp';

import ModalMensaje from '../common/ModalMensaje.vue';



const props = defineProps({

    modelValue: Boolean,

    persona: {

        type: Object,

        default: () => ({})

    }

});



const emit = defineEmits(['update:modelValue', 'save', 'saved']);



const personasStore = usePersonasStore();



const formRef = ref(null);

const loading = ref(false);

const selectedPhoto = ref(null);

const photoPreview = ref(null);

const currentFotoUrl = ref('');



const form = ref({

    nombres: '',

    primerApellido: '',

    segundoApellido: '',

    ci: '',

    genero: '',

    fechaNacimiento: '',

    celular: '',

    email: '',

    direccion: '',

    activo: false

});



const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];



// Feedback refs

const msgShow = ref(false);

const msgTitle = ref('');

const msgContent = ref('');

const msgType = ref('success');



const optionalPhotoRule = (v) => {

    if (!v) return true;

    const file = Array.isArray(v) ? v[0] : v;

    if (!file) return true;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {

        return 'Solo se permiten imágenes JPG, PNG o WEBP';

    }

    if (file.size > PHOTO_MAX_BYTES) {

        return 'La imagen debe pesar máximo 2MB';

    }

    return true;

};



const photoPreviewSrc = computed(() => {

    if (photoPreview.value) return photoPreview.value;

    return resolveUploadUrl(currentFotoUrl.value) || defaultAvatar;

});



const buildPersonaPayload = () => ({ ...form.value });



const normalizePhotoFile = () => {

    if (!selectedPhoto.value) return null;

    return Array.isArray(selectedPhoto.value) ? selectedPhoto.value[0] : selectedPhoto.value;

};



const resetPhotoState = (fotoUrl = '') => {

    if (photoPreview.value) {

        URL.revokeObjectURL(photoPreview.value);

    }

    selectedPhoto.value = null;

    photoPreview.value = null;

    currentFotoUrl.value = fotoUrl;

};



const initForm = () => {

    if (props.persona && Object.keys(props.persona).length > 0) {

        form.value = {

            nombres: props.persona.nombres || '',

            primerApellido: props.persona.primerApellido || '',

            segundoApellido: props.persona.segundoApellido || '',

            ci: props.persona.ci || '',

            genero: props.persona.genero || '',

            fechaNacimiento: props.persona.fechaNacimiento || '',

            celular: props.persona.celular || '',

            email: props.persona.email || '',

            direccion: props.persona.direccion || '',

            activo: props.persona.activo ?? false

        };

        resetPhotoState(props.persona.foto || '');

    } else {

        form.value = {

            nombres: '',

            primerApellido: '',

            segundoApellido: '',

            ci: '',

            genero: '',

            fechaNacimiento: '',

            celular: '',

            email: '',

            direccion: '',

            activo: false

        };

        resetPhotoState('');

    }

};



watch(() => props.modelValue, (isOpen) => {

    if (isOpen) initForm();

});



watch(selectedPhoto, (value) => {

    if (photoPreview.value) {

        URL.revokeObjectURL(photoPreview.value);

        photoPreview.value = null;

    }

    const file = Array.isArray(value) ? value[0] : value;

    if (file) {

        photoPreview.value = URL.createObjectURL(file);

    }

});



const close = () => emit('update:modelValue', false);



const handleSave = async () => {

    const { valid } = await formRef.value.validate();

    if (!valid) return;



    loading.value = true;

    try {

        const payload = buildPersonaPayload();

        const photoFile = normalizePhotoFile();

        const idPersona = props.persona?.idPersona || props.persona?.id_persona || props.persona?.id;



        if (idPersona) {

            await personasStore.updatePersona(idPersona, payload);

            if (photoFile) {

                await personasStore.updatePersonaFoto(idPersona, photoFile);

            }

            msgTitle.value = 'Éxito';

            msgContent.value = 'Información personal actualizada correctamente.';

            msgType.value = 'success';

            msgShow.value = true;

            emit('saved');

        } else {

            emit('save', payload, photoFile);

        }

    } catch (error) {

        console.error('Error al guardar información personal:', error);

        msgTitle.value = 'Error';

        msgContent.value = error.message || 'No se pudo actualizar la información.';

        msgType.value = 'error';

        msgShow.value = true;

    } finally {

        loading.value = false;

    }

};



const handleMsgConfirm = () => {

    msgShow.value = false;

    if (msgType.value === 'success') {

        close();

    }

};

</script>



<style scoped>

.gap-3 {

    gap: 12px;

}



.section-title {

    font-size: 0.75rem;

    text-transform: uppercase;

    letter-spacing: 0.1em;

    font-weight: 800;

    color: #64748b;

    display: flex;

    align-items: center;

}



.shadow-premium {

    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;

}



:deep(.v-field__outline) {

    --v-field-border-opacity: 0.1;

}



.bg-slate-50 {

    background-color: #f8fafc !important;

}

</style>


