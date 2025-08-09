import cubejs from '@cubejs-client/core';

const cubeApi = cubejs(
  'secret', // API token - should match CUBEJS_API_SECRET from backend
  {
    apiUrl: 'http://localhost:4000/cubejs-api/v1'
  }
);

export default cubeApi; 