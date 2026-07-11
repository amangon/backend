// Wraps async route handlers so thrown errors are forwarded to the
// centralized error middleware instead of needing try/catch everywhere.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
