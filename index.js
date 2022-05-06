const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

// Middleware 
app.use(cors());
app.use(express.json());

// MongoDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qm6xo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const perfumeCollection = client.db("perfumania").collection("perfumes");

        // Generate JWT token
        app.post("/login", (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
            res.send({token});
        })

        // Get all items 
        app.get("/perfumes", async (req, res) => {
            const query = req.query;
            const cursor = perfumeCollection.find(query);
            const perfumes = await cursor.toArray();
            res.send(perfumes);
        })

        // Get Specific items using query
        app.get("/myPerfumes", async (req, res) => {
            const email = req.query.email;
            const token = req.query.token;
            const query = {email};
            const decoded = verifyToken(token);
            console.log('normal',email,'decoded', decoded);
            if(email === decoded.email) {
                const cursor = perfumeCollection.find(query);
                const perfumes = await cursor.toArray();
                res.send({authorization: 'successful', perfumes});
            }
            else {
                const perfumes = [];
                res.send({authorization: 'failed', perfumes});
            }
        })

        // Get top products 
        app.get("/topProducts", async (req, res) => {
            const query = {sold: {$gt: 35}};
            const options = {sort: {sold: -1}}
            const cursor = perfumeCollection.find(query, options);
            const perfumes = await cursor.toArray();
            res.send(perfumes);
        })

        // Get single Perfume
        app.get("/perfume/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const perfume = await perfumeCollection.findOne(query);
            res.send(perfume);
        })

        // Add Perfume
        app.post("/perfume", async (req, res) => {
            const perfume = req.body;
            console.log(perfume);
            const result = await perfumeCollection.insertOne(perfume);
            res.send(result);
        })

        // Update perfume
        app.put("/perfume/:id", async (req, res) => {
            const id = req.params.id;
            const perfume = req.body;
            const filter = {_id: ObjectId(id)};
            const options = { upsert: true };
            const updatedPerfume = {
                $set: perfume
            }
            const result = await perfumeCollection.updateOne(filter, updatedPerfume, options);
            res.send(result);
        })

        // Delete Perfume
        app.delete("/perfume/:id", async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await perfumeCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}

run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Perfumania is up and running perfectly");
})

app.listen(port, () => {
    console.log('Listening to Perfumania, port', port);
})

// Verify Token
function verifyToken(token) {
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
        if(err) {
            email = {email: 'Invalid Email'};
        }
        if(decoded) {
            email = decoded;
        }
    });

    return email;
}