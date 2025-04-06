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

// Sample data for API tests
const sampleData = {
  template: {
    name: 'Test Template',
    description: 'Template for API testing',
    workflow: [
      {
        source_tool: 'test_tool',
        data: { action: 'test' }
      }
    ],
    tags: ['test', 'api'],
    workspaceId: '1',
    createdBy: {
      id: '1',
      name: 'Test User'
    }
  },
  code: `function getUser(id) {
    return db.users.findOne({ _id: id });
  }`,
  copilotMessage: 'How do I implement error handling?',
  copilotSuggestion: {
    input: 'Add retry logic',
    target: 'error_handler'
  }
};

// Test suites for different API categories
const testSuites: TestSuite[] = [
  {
    name: 'Health Check',
    tests: [
      async () => {
        const start = Date.now();
        try {
          const response = await axios.get('http://localhost:3000/health');
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
  },
  {
    name: 'Gemini API',
    tests: [
      // Test Gemini chat
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.sendCopilotMessage('Hello, can you help me with coding?');
          return {
            endpoint: '/copilot/chat',
            success: typeof response.message === 'string' && response.message.length > 0,
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/copilot/chat',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      // Test Gemini code transcoding
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.transcodeCode('function add(a, b) { return a + b; }');
          return {
            endpoint: '/transcode',
            success: !!response.output,
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/transcode',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    ]
  },
  {
    name: 'Templates',
    tests: [
      // Get templates
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.getTemplates();
          return {
            endpoint: '/templates',
            success: Array.isArray(response.templates),
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/templates',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      // Search templates
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.searchTemplates('test');
          return {
            endpoint: '/templates/search',
            success: Array.isArray(response.templates),
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/templates/search',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      // Create template
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.createTemplate(sampleData.template);
          return {
            endpoint: '/templates (POST)',
            success: !!response.template?.id,
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/templates (POST)',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    ]
  },
  {
    name: 'Adapters',
    tests: [
      // Get adapters
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.getAdapters();
          return {
            endpoint: '/adapters',
            success: Array.isArray(response.adapters),
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/adapters',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      // Reload adapters
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.reloadAdapters();
          return {
            endpoint: '/adapters/reload',
            success: response.success === true,
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/adapters/reload',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    ]
  },
  {
    name: 'Transcode',
    tests: [
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.transcodeCode(sampleData.code);
          return {
            endpoint: '/transcode',
            success: !!response.output,
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/transcode',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    ]
  },
  {
    name: 'Copilot',
    tests: [
      // Test chat
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.sendCopilotMessage(sampleData.copilotMessage);
          return {
            endpoint: '/copilot/chat',
            success: !!response.message,
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/copilot/chat',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      },
      // Test suggestions
      async () => {
        const start = Date.now();
        try {
          const response = await apiClient.askCopilot(
            sampleData.copilotSuggestion.input,
            sampleData.copilotSuggestion.target
          );
          return {
            endpoint: '/copilot/suggest',
            success: !!response.suggestion,
            duration: Date.now() - start,
            response
          };
        } catch (error) {
          return {
            endpoint: '/copilot/suggest',
            success: false,
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    ]
  }
];

// Main test runner
export async function runApiTests() {
  console.log('🚀 Starting API Tests\n');
  const results: TestResult[] = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const suite of testSuites) {
    console.log(`\n📋 Test Suite: ${suite.name}`);
    console.log('='.repeat(40));

    for (const test of suite.tests) {
      totalTests++;
      const result = await test();
      results.push(result);

      if (result.success) {
        passedTests++;
        console.log(`✅ ${result.endpoint} (${result.duration}ms)`);
      } else {
        console.log(`❌ ${result.endpoint} (${result.duration}ms)`);
        console.log(`   Error: ${result.error}`);
      }
    }
  }

  // Print summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(40));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  return {
    results,
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests
    }
  };
}

// Run tests when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runApiTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}