require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');
const authProtect = require('./middleware/authMiddleware');
const Transaction = require('./models/Transaction');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Все поля обязательны!' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name,
            email,
            password: passwordHash
        });
        return res.status(201).json({ message: 'Пользователь успешно создан!' });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Все поля обязательны!' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Неверный логин или пароль!' });
        }

        const comparePassword = await bcrypt.compare(password, user.password);

        if (!comparePassword) {
            return res.status(400).json({ message: 'Неверный логин или пароль!' });
        }

        const token = jwt.sign(
            {
                id: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        return res.status(200).json({
            userId: user._id,
            token
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/auth/me', authProtect, async (req, res) => {
    try {
        const user = await User.findById(req.userId)?.select('-password');
        if (!user) {
            return res.status(404).json({message: 'Пользователь не найден!'});
        }
        return res.status(200).json(user);
    } catch (error) {
        // console.error(error);
        return res.status(500).json({ message: 'Server Error!' });
    }
});

app.post('/api/transactions/add', authProtect, async (req, res) => {
    const {userId, title, type, date, amount} = req.body;

    if (!title || !type || !date || !amount) {
        return res.status(400).json({ message: 'Все поля обязательны!' });
    } 

    try {
        const newTransaction = await Transaction.create({
            userId,
            title,
            type,
            date,
            amount
        });

        return res.status(200).json(newTransaction);
    } catch (error) {
        // console.error(error)
        return res.status(500).json({ message: 'Server Error!' });
    }
});

app.get('/api/transactions/get', authProtect, async (req, res) => {
    const {userId} = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'Все поля обязательны!' });
    }

    try {
        const transactions = await Transaction.find({userId}).sort({createdAt: -1});
        return res.status(200).json(transactions);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error!' });
    }
});

app.delete('/api/transactions/delete/:id', authProtect, async (req, res) => {
    const { id } = req.params;
    
    try {
        const transaction = await Transaction.findByIdAndDelete(id);
        if (!transaction) {
            return res.status(400).json({message: 'Transaction not found!'});
        }
        return res.status(200).json({message: 'Transaction deleted!'});
    } catch (error) {
        return res.status(500).json({ message: 'Server Error!' });
    }
});


app.listen(5002, () => {
    console.log('Server Start!');
});