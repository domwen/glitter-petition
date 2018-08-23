const spicedPg = require('spiced-pg');

const db = spicedPg('postgres:postgres:postgres@localhost:5432/postgres');

module.exports.saveProfile = params => {
    const q =
        'INSERT INTO user_profiles (age,city,url, user_id) VALUES ($1,$2,$3, $4) RETURNING age,city,url, user_id';
    console.log('inside savesigners');
    return db.query(q, params);
};

module.exports.saveSignature = params => {
    const q =
        'INSERT INTO signatures (signature,user_id) VALUES ($1,$2) RETURNING id, user_id';
    console.log('inside savesigners');
    return db.query(q, params);
};

module.exports.getSignature = signID => {
    const q = 'SELECT signature FROM signatures WHERE id = $1 ';
    const params = [signID];
    return db.query(q, params).then(results => {
        return results.rows[0].signature;
    });
};

exports.deleteSignature = user_id => {
    const q = `
    DELETE FROM signatures
    WHERE user_id = ($1)
    `;
    return db.query(q, [user_id]);
};

module.exports.saveUser = params => {
    const q =
        'INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING first,last,id';
    return db.query(q, params);
};

module.exports.getPassword = params => {
    const q = 'SELECT password FROM users WHERE email = $1';
    return db.query(q, [params]);
};

module.exports.getSignerData = getSignerData => {
    return db.query(
        'SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url FROM users JOIN user_profiles ON users.id = user_profiles.user_id'
    );
};
