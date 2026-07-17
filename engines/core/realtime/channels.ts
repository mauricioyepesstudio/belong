export const realtimeChannels = {
  community: (communityId: string) => `community:${communityId}`,
  project: (projectId: string) => `project:${projectId}`,
  mission: (missionId: string) => `mission:${missionId}`,
  identity: (userId: string) => `identity:${userId}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  discussion: (discussionId: string) => `discussion:${discussionId}`,
  presence: (scope: string, id: string) => `presence:${scope}:${id}`,
} as const;
