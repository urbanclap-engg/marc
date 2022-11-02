export interface ProfilerInterface {
  triggerProfiler(strategy: Strategy, profileType: ProfileType, duration?: number): any
}

export enum Strategy {
  ON_DEMAND = 'on-demand',
  CONTINUOUS = 'continuous',
}

export enum ProfileType {
  MEMORY = 'memory',
  CPU = 'cpu',
}

export interface TriggerContinuousProfiler {
  (profileType: ProfileType): any
}

export interface GetFileName { 
  (profileType: ProfileType): string
}

export interface TriggerOnDemandProfiler {
  (profileType: ProfileType, duration: number): string
}
