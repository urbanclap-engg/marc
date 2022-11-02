const app = {
  use: jest.fn(),
  listen: jest.fn(() => {
    return {};
  }),
  post: jest.fn(),
  get: jest.fn()
};
jest.doMock('express', () => {
  return () => {
    return app;
  };
});
jest.doMock('../../../../../middleware');
jest.doMock('../../../../../rate_limit/index', () => {
  return  jest.fn();
});
module.exports = app;
