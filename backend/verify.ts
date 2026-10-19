import { AppDataSource } from './src/data-source';
import { Usuario } from './src/modules/users/entities/usuario.entity';

async function verifyRoles() {
    await AppDataSource.initialize();

    const user = await AppDataSource.getRepository(Usuario).findOne({
        where: { username: 'p.rojas.odontologia' },
        relations: ['persona', 'persona.asignacionesRoles', 'persona.asignacionesRoles.rol']
    });

    if (!user) {
        console.log('User not found');
    } else {
        console.log(`User: ${user.username}`);
        const roles = user.persona?.asignacionesRoles || [];
        console.log(`Active Roles Count: ${roles.filter(r => r.activo).length}`);
        roles.forEach(ar => {
            console.log(` - [${ar.activo ? 'ACTIVO' : 'INACTIVO'}] Rol: ${ar.rol.nombre} (ID: ${ar.rol.idRol})`);
        });
    }

    await AppDataSource.destroy();
}

verifyRoles().catch(console.error);
