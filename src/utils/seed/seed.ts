
import { AppDataSource } from '../../config/data-source';
import { Role, RoleName } from '../../entities/Role.entity';
import { User } from '../../entities/User.entity';
import bcrypt from 'bcryptjs';

export async function seedInitialData() {
  const roleRepository = AppDataSource.getRepository(Role);
  const userRepository = AppDataSource.getRepository(User);

  // Seed roles if they don't exist
  const adminRole = await roleRepository.findOneBy({ name: RoleName.ADMIN });
  const agentRole = await roleRepository.findOneBy({ name: RoleName.AGENT });

  if (!adminRole) {
    await roleRepository.save([
      { name: RoleName.ADMIN, description: 'Coordinator with full access' },
      { name: RoleName.AGENT, description: 'Field agent limited to assigned fields' },
    ]);
    console.log('Roles seeded successfully');
  }

  // Check if any admin user exists
  const adminExists = await userRepository.findOne({
    where: { role: { name: RoleName.ADMIN } },
    relations: ['role'],
  });

  if (!adminExists) {
    const adminRoleEntity = await roleRepository.findOneBy({ name: RoleName.ADMIN });
    if (adminRoleEntity) {
      const hashedPassword = await bcrypt.hash('admin123Account#', 10);
      const adminUser = userRepository.create({
        name: 'Super Admin',
        email: 'admin@smartseason.com',
        password: hashedPassword, 
        roleId: adminRoleEntity.id,
        firstLogin: true,
      });
      await userRepository.save(adminUser);
      console.log('Default admin user created: admin@smartseason.com / admin123');
    }
  }
}