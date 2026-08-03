export interface CrashUserContext {
  id?: string;
  email?: string | null;
  username?: string;
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

class CrashReporterService {
  private userContext: { hashedUserId?: string } = {};

  setUser(user: CrashUserContext | null) {
    if (!user || (!user.id && !user.email)) {
      this.userContext = {};
      return;
    }
    const identifier = user.id || user.email || user.username || "anonymous";
    this.userContext = {
      hashedUserId: hashString(identifier),
    };
  }

  reportError(error: Error, route?: string, extraInfo?: Record<string, any>) {
    const payload = {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      route: route || "unknown_route",
      user: this.userContext,
      extra: extraInfo,
      timestamp: new Date().toISOString(),
    };

    console.error("[CrashReporter] Error captured:", JSON.stringify(payload, null, 2));

    // If Sentry (@sentry/react-native) is imported/configured in production:
    // Sentry.captureException(error, { tags: { route }, user: { id: this.userContext.hashedUserId }, extra: extraInfo });
  }
}

export const crashReporter = new CrashReporterService();
