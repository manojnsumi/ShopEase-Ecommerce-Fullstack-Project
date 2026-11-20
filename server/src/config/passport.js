const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// database.js may export either a raw pool OR an object like { pool, testConnection }.
// This line works for both shapes automatically:
const dbModule = require('./database');
const pool = dbModule.pool || dbModule;

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          // Use the same table + column names as your existing login controller
          const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
          const user = rows[0];

          if (!user) return done(null, false, { message: 'Invalid email or password' });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return done(null, false, { message: 'Invalid email or password' });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};