const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());

const db = new sqlite3.Database('./quotes.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT,
        author TEXT
    )`);
});

app.get('/api/new-quote', async (req, res) => {
    try {
        const response = await fetch('https://dummyjson.com/quotes/random');
        const data = await response.json();
        
        const stmt = db.prepare("INSERT INTO history (quote, author) VALUES (?, ?)");
        stmt.run([data.quote, data.author], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ quote: data.quote, author: data.author });
        });
        stmt.finalize();
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch external quote.' });
    }
});

app.get('/api/history', (req, res) => {
    db.all("SELECT * FROM history ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// NEW: Delete a specific quote by ID
app.delete('/api/history/:id', (req, res) => {
    const quoteId = req.params.id;
    db.run("DELETE FROM history WHERE id = ?", [quoteId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes > 0) {
            res.json({ message: "Quote deleted successfully!" });
        } else {
            res.status(404).json({ error: "Quote not found." });
        }
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));