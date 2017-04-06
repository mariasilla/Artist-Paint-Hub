DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS paintings CASCADE;
DROP TABLE IF EXISTS comments CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  nickname VARCHAR(255),
  level VARCHAR(255),
  favorite_method VARCHAR(255),
  password_digest VARCHAR(255)
  -- add location attribute
);

CREATE TABLE paintings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description VARCHAR(255),
  type VARCHAR(255),
  image_url VARCHAR(255),
  likes INTEGER,
  user_id INTEGER REFERENCES users(id)
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  description VARCHAR(255),
  painting_id INTEGER REFERENCES paintings(id),
  user_id INTEGER REFERENCES users(id)
);
