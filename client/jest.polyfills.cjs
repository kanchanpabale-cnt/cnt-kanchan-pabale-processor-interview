// Runs once before each test file in a module-less environment.
// Inject the constant Vite would normally inject at build time for axios.
// eslint-disable-next-line no-undef
global.__APP_API_BASE_URL__ = '/api';
