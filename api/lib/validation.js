// api/lib/validation.js
// Input validation and sanitization

const MAX_POST_TITLE = parseInt(process.env.MAX_POST_TITLE_CHARS || 200);
const MAX_POST_BODY = parseInt(process.env.MAX_POST_BODY_CHARS || 10000);
const MAX_COMMENT = parseInt(process.env.MAX_COMMENT_CHARS || 2000);

/**
 * Sanitize string input
 */
function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input.trim().substring(0, 10000); // Basic length prevent
}

/**
 * Validate email
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(sanitize(email));
}

/**
 * Validate password
 * Min 8 chars, at least one letter, one number
 */
function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (!/[a-zA-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Validate username
 * 3-20 chars, alphanumeric + underscore
 */
function isValidUsername(username) {
  const str = sanitize(username);
  return /^[a-zA-Z0-9_]{3,20}$/.test(str);
}

/**
 * Validate post title
 */
function isValidPostTitle(title) {
  const str = sanitize(title);
  return str.length >= 3 && str.length <= MAX_POST_TITLE;
}

/**
 * Validate post body
 */
function isValidPostBody(body) {
  const str = sanitize(body);
  return str.length >= 10 && str.length <= MAX_POST_BODY;
}

/**
 * Validate comment
 */
function isValidComment(comment) {
  const str = sanitize(comment);
  return str.length >= 1 && str.length <= MAX_COMMENT;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format error response
 */
function formatError(message, statusCode = 400) {
  return { error: message, status: statusCode };
}

/**
 * Format success response
 */
function formatSuccess(data, statusCode = 200) {
  return { data, status: statusCode };
}

module.exports = {
  sanitize,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidPostTitle,
  isValidPostBody,
  isValidComment,
  escapeHtml,
  formatError,
  formatSuccess,
  MAX_POST_TITLE,
  MAX_POST_BODY,
  MAX_COMMENT
};
