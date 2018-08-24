-- Create signatures table

DROP TABLE IF EXISTS signatures;
CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    signature text NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL
);

  -- Create users table
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(200) NOT NULL,
        last VARCHAR(200) NOT NULL,
        email VARCHAR(200) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL
);

-- Create user_profiles table
CREATE TABLE user_profiles(
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  age INTEGER,
  city VARCHAR(200),
  url text
);
