function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "readWrite") {
    return next();
  }

  const username = req.session.user
    ? req.session.user.username
    : "unknown user";
  return res.status(403).json({
    error: `Permission denied for ${username}. Contact the administrator.`,
  });
}

module.exports = { isAdmin };
