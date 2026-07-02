class HealthService {
  getHealthStatus() {
    return { status: 'ok' };
  }
}

export const healthService = new HealthService();
