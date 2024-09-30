const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'smoketrees.db');
let db = null;

const initializeDbAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(5000, () => {
            console.log('Server Running at http://localhost:5000/');
        });
    } catch (e) {
        console.log(`DB error: ${e.message}`);
        process.exit(1);
    }
};
initializeDbAndServer();


app.get('/user/', async (request,response)=> {
    const allUsersQuery = `
    SELECT User.id AS userId, User.name, Address.address
    FROM User
    LEFT JOIN Address ON User.id = Address.userId;`;
   const allusers = await db.all(allUsersQuery);
   response.send(allusers)

})

app.post('/register', async (request, response) => {
    const { name, address } = request.body;

    const insertUserQuery = `
    INSERT INTO User (name) VALUES (?);
    `;
    
    const insertAddressQuery = `
    INSERT INTO Address (userId, address) VALUES (?, ?);
    `;

    const result = await db.run(insertUserQuery, [name]);
    const userId = result.lastID;

    await db.run(insertAddressQuery, [userId, address]);
    response.send({ userId, name, address });
});


app.delete('/user/:id', async (request, response) => {
    const { id } = request.params;

    const deleteAddressQuery = `
    DELETE FROM Address WHERE userId = ?;
    `;
    
    const deleteUserQuery = `
    DELETE FROM User WHERE id = ?;
    `;

    try {
        await db.run(deleteAddressQuery, [id]);
        await db.run(deleteUserQuery, [id]);
        response.send({ message: "User deleted successfully", userId: id });
    } catch (error) {
        console.error("Error deleting user:", error);
        response.status(500).send("Internal Server Error");
    }
});
