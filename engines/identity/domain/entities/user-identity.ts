import { Bio } from "../value-objects/bio";
import type { ExperienceEntry } from "../value-objects/experience-entry";
import { ExperienceCollection } from "../value-objects/experience-entry";
import { LabeledItem } from "../value-objects/labeled-item";
import { Location } from "../value-objects/location";
import { Name } from "../value-objects/name";
import {
  PersonalityProfile,
  type PersonalityTrait,
} from "../value-objects/personality-profile";
import { Role } from "../value-objects/role";

export type UserIdentityProps = {
  userId: string;
  email: string;
  name: Name;
  bio: Bio;
  location: Location;
  role: Role;
  avatarUrl: string | null;
  skills: LabeledItem[];
  strengths: LabeledItem[];
  interests: LabeledItem[];
  values: LabeledItem[];
  personality: PersonalityProfile;
  experience: ExperienceCollection;
  createdAt: string;
  updatedAt: string;
};

export class UserIdentity {
  readonly userId: string;
  readonly email: string;
  readonly name: Name;
  readonly bio: Bio;
  readonly location: Location;
  readonly role: Role;
  readonly avatarUrl: string | null;
  readonly skills: readonly LabeledItem[];
  readonly strengths: readonly LabeledItem[];
  readonly interests: readonly LabeledItem[];
  readonly values: readonly LabeledItem[];
  readonly personality: PersonalityProfile;
  readonly experience: ExperienceCollection;
  readonly createdAt: string;
  readonly updatedAt: string;

  private constructor(props: UserIdentityProps) {
    this.userId = props.userId;
    this.email = props.email;
    this.name = props.name;
    this.bio = props.bio;
    this.location = props.location;
    this.role = props.role;
    this.avatarUrl = props.avatarUrl;
    this.skills = Object.freeze([...props.skills]);
    this.strengths = Object.freeze([...props.strengths]);
    this.interests = Object.freeze([...props.interests]);
    this.values = Object.freeze([...props.values]);
    this.personality = props.personality;
    this.experience = props.experience;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: UserIdentityProps): UserIdentity {
    return new UserIdentity(props);
  }

  get displayName(): string {
    return this.name.value ?? this.email.split("@")[0] ?? "Member";
  }

  get skillValues(): string[] {
    return this.skills.map((item) => item.value);
  }

  get strengthValues(): string[] {
    return this.strengths.map((item) => item.value);
  }

  get interestValues(): string[] {
    return this.interests.map((item) => item.value);
  }

  get valueItems(): string[] {
    return this.values.map((item) => item.value);
  }

  get personalityTraits(): PersonalityTrait[] {
    return [...this.personality.traits];
  }

  get experienceEntries(): ExperienceEntry[] {
    return [...this.experience.entries];
  }

  withProfile(input: {
    name?: Name;
    bio?: Bio;
    location?: Location;
    role?: Role;
    avatarUrl?: string | null;
    updatedAt: string;
  }): UserIdentity {
    return UserIdentity.create({
      userId: this.userId,
      email: this.email,
      name: input.name ?? this.name,
      bio: input.bio ?? this.bio,
      location: input.location ?? this.location,
      role: input.role ?? this.role,
      avatarUrl: input.avatarUrl !== undefined ? input.avatarUrl : this.avatarUrl,
      skills: [...this.skills],
      strengths: [...this.strengths],
      interests: [...this.interests],
      values: [...this.values],
      personality: this.personality,
      experience: this.experience,
      createdAt: this.createdAt,
      updatedAt: input.updatedAt,
    });
  }

  withCollections(input: {
    skills?: LabeledItem[];
    strengths?: LabeledItem[];
    interests?: LabeledItem[];
    values?: LabeledItem[];
    updatedAt: string;
  }): UserIdentity {
    return UserIdentity.create({
      userId: this.userId,
      email: this.email,
      name: this.name,
      bio: this.bio,
      location: this.location,
      role: this.role,
      avatarUrl: this.avatarUrl,
      skills: input.skills ?? [...this.skills],
      strengths: input.strengths ?? [...this.strengths],
      interests: input.interests ?? [...this.interests],
      values: input.values ?? [...this.values],
      personality: this.personality,
      experience: this.experience,
      createdAt: this.createdAt,
      updatedAt: input.updatedAt,
    });
  }

  withPersonality(personality: PersonalityProfile, updatedAt: string): UserIdentity {
    return UserIdentity.create({
      userId: this.userId,
      email: this.email,
      name: this.name,
      bio: this.bio,
      location: this.location,
      role: this.role,
      avatarUrl: this.avatarUrl,
      skills: [...this.skills],
      strengths: [...this.strengths],
      interests: [...this.interests],
      values: [...this.values],
      personality,
      experience: this.experience,
      createdAt: this.createdAt,
      updatedAt,
    });
  }

  withExperience(experience: ExperienceCollection, updatedAt: string): UserIdentity {
    return UserIdentity.create({
      userId: this.userId,
      email: this.email,
      name: this.name,
      bio: this.bio,
      location: this.location,
      role: this.role,
      avatarUrl: this.avatarUrl,
      skills: [...this.skills],
      strengths: [...this.strengths],
      interests: [...this.interests],
      values: [...this.values],
      personality: this.personality,
      experience,
      createdAt: this.createdAt,
      updatedAt,
    });
  }
}
