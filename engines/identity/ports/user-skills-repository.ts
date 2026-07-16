export interface UserSkillsRepository {
  findByUserId(userId: string): Promise<string[]>;
  replaceAll(userId: string, skills: string[]): Promise<string[]>;
}
