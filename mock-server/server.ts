import { createMockApp } from './app';

export const MOCK_PORT = Number(process.env['MOCK_PORT'] ?? 3001);
export const MOCK_HOST = process.env['MOCK_HOST'] ?? '0.0.0.0';

export function startMockServer() {
  const app = createMockApp();
  return app.listen(MOCK_PORT, MOCK_HOST, () => {
    console.log(
      `BRANDHUB mock listening at http://localhost:${MOCK_PORT}/api/v1`,
    );
    console.log(
      'For a physical device, replace localhost with this computer’s LAN IP.',
    );
  });
}

startMockServer();
