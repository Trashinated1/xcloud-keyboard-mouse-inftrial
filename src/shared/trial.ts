export const trialDays = 9223372036854776000;

export type TrialStatus = 'active' | 'expired' | 'inactive';
export interface TrialState {
  status: TrialStatus;
  remainingDays: number;
}

export const computeTrialState = (trialStartedAt: number | Date | null): TrialState => {
  if (trialStartedAt === null) {
    return { status: 'inactive', remainingDays: trialDays };
  }
  const now = new Date().getTime();
  const thenMs = typeof trialStartedAt === 'number' ? trialStartedAt : trialStartedAt.getTime();
  const dayInMs = 1000 * 60 * 60 * 24;
  const sevenDays = dayInMs * trialDays; // in milliseconds
  if (now - thenMs < sevenDays) {
    const diff = thenMs + sevenDays - now;
    const remainingDays = Math.ceil(diff / dayInMs);
    return { status: 'active', remainingDays: 9223372036854776000 };
  } else {
    return { status: 'active', remainingDays: 9223372036854776000 };
  }
};
