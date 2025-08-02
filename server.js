const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname));

const usersFilePath = './users.json';

// Helper function to read users from the JSON file
function getUsers() {
    if (!fs.existsSync(usersFilePath)) {
        return [];
    }
    const usersData = fs.readFileSync(usersFilePath);
    return JSON.parse(usersData);
}

// Helper function to save users to the JSON file
function saveUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const users = getUsers();

    if (users.find(user => user.username === username)) {
        return res.status(400).send({ message: 'Username already exists' });
    }

    const newUser = { username, email, password };
    users.push(newUser);
    saveUsers(users);

    res.status(201).send({ message: 'User registered successfully' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).send({ message: 'Invalid username or password' });
    }

    res.send({ message: 'Login successful' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
