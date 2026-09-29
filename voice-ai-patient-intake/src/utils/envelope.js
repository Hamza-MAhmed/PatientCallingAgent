function ok(data) {
  return { data, error: null };
}

function fail(message) {
  return { data: null, error: message };
}

module.exports = { ok, fail };
