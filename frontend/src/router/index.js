import { createRouter, createWebHistory } from 'vue-router'
import { readSession } from '@/utils/authToken'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../views/Landing.vue'),
      meta: { publicLayout: true },
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: () => import('../views/Usuarios.vue')
    },
    {
      path: '/productos',
      name: 'productos',
      component: () => import('../views/Productos.vue')
    },
    {
      path: '/reportes',
      name: 'reportes',
      component: () => import('../views/Reportes.vue')
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: () => import('../views/Configuracion.vue')
    },
    {
      path: "/mof/listar-unidades",
      name: 'listar_unidades',
      component: () => import('../views/MOF/ListarUnidades.vue')
    },
    {
      path: '/postas-medicas',
      name: 'postas_medicas',
      component: () => import('../views/PostasMedicas.vue')
    },
    {
      path: '/especialidades-medicas',
      name: 'especialidades_medicas',
      component: () => import('../views/EspecialidadesMedicas.vue')
    },
    {
      path: '/catalogos-academicos',
      name: 'catalogos_academicos',
      component: () => import('../views/CatalogosAcademicos.vue')
    },
    {
      path: '/administrar/personas',
      name: 'administrar_personas',
      component: () => import('../views/PostasMedicas.vue')
    },
    {
      path: '/administrar/estudiantes',
      name: 'administrar_estudiantes',
      component: () => import('../views/PostasMedicas.vue')
    },
    {
      path: '/administrar/docentes',
      name: 'administrar_docentes',
      component: () => import('../views/PostasMedicas.vue')
    },
    {
      path: '/administrar/administrativos',
      name: 'administrar_administrativos',
      component: () => import('../views/PostasMedicas.vue')
    },
    {
      path: '/administrar/consultores',
      name: 'administrar_consultores',
      component: () => import('../views/PostasMedicas.vue')
    },
    {
      path: '/administrar/doctores',
      name: 'administrar_doctores',
      component: () => import('../views/PostasMedicas.vue')
    },
    {
      path: '/reservar',
      name: 'reservar',
      component: () => import('../views/Reservar.vue')
    },
    {
      path: '/historial',
      name: 'historial',
      component: () => import('../views/Historial.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { publicLayout: true },
    },
    {
      path: '/olvidar-contrasena',
      name: 'olvidar_contrasena',
      component: () => import('../views/OlvidarContrasena.vue'),
      meta: { publicLayout: true },
    },
    {
      path: '/restablecer-contrasena',
      name: 'restablecer_contrasena',
      component: () => import('../views/RestablecerContrasena.vue'),
      meta: { publicLayout: true },
    },
    {
      path: '/doctor/home',
      name: 'doctor_home',
      component: () => import('../views/HomeDoctor.vue')
    },
    {
      path: '/admin/consejos',
      name: 'admin_consejos',
      component: () => import('../views/ConsejosAdmin.vue')
    },
    {
      path: '/director/home',
      name: 'director_home',
      component: () => import('../views/HomeDirector.vue')
    },
    {
      path: '/formularios',
      name: 'formularios',
      component: () => import('../views/Formularios.vue')
    },
    {
      path: '/formularios/pacientes',
      name: 'formularios_pacientes',
      component: () => import('../views/FormulariosPacientes.vue')
    },
    {
      path: '/formularios/:id/preview',
      name: 'formulario_preview',
      component: () => import('../views/FormularioPreview.vue')
    },
    {
      path: '/formularios/:id',
      name: 'formulario_builder',
      component: () => import('../views/FormularioBuilder.vue')
    },
    {
      path: '/llenar-formularios',
      name: 'llenar_formularios',
      component: () => import('../views/LlenarFormularios.vue')
    },
    {
      path: '/llenar-formularios/instancias/:id',
      name: 'ver_formulario_instancia',
      component: () => import('../views/VerFormularioInstancia.vue')
    },
    {
      path: '/llenar-formularios/:id',
      name: 'llenar_formulario_instancia',
      component: () => import('../views/LlenarFormularioInstancia.vue')
    },
    {
      path: '/doctores',
      name: 'doctores',
      component: () => import('../views/Doctores.vue')
    },
    {
      path: '/doctor/historial-medico',
      name: 'historial_medico',
      component: () => import('../views/HistorialMedico.vue')
    },
    {
      path: '/doctor/agenda',
      name: 'doctor_agenda',
      component: () => import('../views/AgendaDoctor.vue')
    },
    {
      path: '/administrar-cuenta',
      name: 'administrar_cuenta',
      component: () => import('../views/AdministrarCuenta.vue')
    }
  ]
})

const homeForRole = (rol) => {
  if (rol === 'DOCTOR') return '/doctor/home'
  if (rol === 'DIRECTOR') return '/director/home'
  return '/home'
}

router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/', '/olvidar-contrasena', '/restablecer-contrasena']
  const authRequired = !publicPages.includes(to.path)
  const session = readSession()
  const loggedIn = Boolean(session.token)

  if (authRequired && !loggedIn) {
    return next({
      path: '/login',
      query: {
        redirect: to.fullPath,
        ...(session.expired ? { sesion: 'expirada' } : {}),
      },
    })
  }

  if (loggedIn) {
    const user = session.user
    const rol = user?.rol
    const mustChangePassword = user?.mustChangePassword === true

    if (mustChangePassword && to.path !== '/administrar-cuenta') {
      return next('/administrar-cuenta?cambiarContrasena=1')
    }

    const isSuper = rol === 'SUPERUSUARIO'
    const isDirector = ['DIRECTOR'].includes(rol)
    const isDoctor = ['DOCTOR'].includes(rol)
    const isPatient = ['ESTUDIANTE', 'DOCENTE', 'CONSULTOR', 'ADMINISTRATIVO'].includes(rol)

    // Login o landing → home del rol
    if (to.path === '/login' || to.path === '/') {
      if (mustChangePassword) return next('/administrar-cuenta?cambiarContrasena=1')
      return next(homeForRole(rol))
    }

    const adminPages = [
      '/usuarios', '/productos', '/reportes', '/configuracion',
      '/mof/listar-unidades', '/postas-medicas', '/especialidades-medicas',
      '/catalogos-academicos',
      '/administrar/personas', '/administrar/estudiantes', '/administrar/docentes',
      '/administrar/administrativos', '/administrar/consultores', '/administrar/doctores',
      '/admin/consejos', '/doctores', '/formularios'
    ]
    if (isPatient && adminPages.includes(to.path)) {
      return next('/home')
    }

    if (isDoctor) {
      const allowedForDoctors = [
        '/doctor/home',
        '/doctor/agenda',
        '/doctor/historial-medico',
        '/administrar-cuenta',
        '/login',
        '/llenar-formularios',
        '/formularios/pacientes',
      ]
      const allowed =
        allowedForDoctors.includes(to.path) ||
        to.path.startsWith('/llenar-formularios/')
      if (!allowed) {
        return next('/doctor/home')
      }
    }

    if (isDirector) {
      const forbiddenForDirectors = ['/', '/home', '/reservar', '/historial']
      if (forbiddenForDirectors.includes(to.path)) {
        return next('/director/home')
      }
    }

    // Admin de plantillas: solo Super/Director
    if (
      (to.path === '/formularios' ||
        /^\/formularios\/\d+(\/preview)?$/.test(to.path)) &&
      !(isDirector || isSuper)
    ) {
      return next(homeForRole(rol))
    }

    // Lista pacientes con formularios: Super/Director/Doctor
    if (to.path === '/formularios/pacientes' && !(isDirector || isSuper || isDoctor)) {
      return next(homeForRole(rol))
    }

    if (to.path === '/catalogos-academicos' && !isSuper) {
      if (isDirector) return next('/director/home')
      if (isDoctor) return next('/doctor/home')
      if (isPatient) return next('/home')
      return next('/login')
    }
  }

  next()
})

export default router
