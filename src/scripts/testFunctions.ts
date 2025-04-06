import axios from 'axios';
import { apiClient } from '../lib/api';

export interface TestResult {
  endpoint: string;
  success: boolean;
  duration: number;
  response?: any;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: (() => Promise<TestResult>)[];
}

const testSuites: TestSuite[] = [
  {
    name: 'Health Check',
    tests: [
      async () => {
        const start = Date.now();
        try {
          const response = await axios.get('const response = await axios.get('https://argos-backend-elkxxhknhq-uc.a.run.app/health');
);
          return {
            endpoint: '/health',
            success: response.data.status === 'ok',
            duration: Date.now() - start,
            response: response.data
          };
        } catch (error) {
          return {
            endpoint: '/health',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    ]
  }
];
