import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/User';
import * as bcrypt from 'bcryptjs';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createUser(userData: {
    email: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const { email, password, role = UserRole.USER } = userData;
    
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      passwordHash,
      role,
    });

    return await this.userRepository.save(user);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'email', 'role', 'createdAt'],
      relations: ['validationRuns'],
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'role', 'createdAt'],
      relations: ['validationRuns'],
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['validationRuns'],
    });
  }

  async updateUser(id: string, updateData: {
    email?: string;
    password?: string;
    role?: UserRole;
  }): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    if (updateData.email) {
      user.email = updateData.email;
    }
    if (updateData.password) {
      user.passwordHash = await bcrypt.hash(updateData.password, 10);
    }
    if (updateData.role) {
      user.role = updateData.role;
    }

    return await this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected > 0;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.passwordHash);
  }
}
