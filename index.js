const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@biplob.whidwsu.mongodb.net/?appName=Biplob`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("mfs").collection("users")

    // users insert api
    app.post('/insertUser', async (req, res) => {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result);
    });

    // Login API
    app.post('/login', async (req, res) => {
      try {
        const { mobileNumber, pin } = req.body;
    
        // Find user with the given mobile number and pin
        const user = await userCollection.findOne({ mobileNumber: mobileNumber, pin: pin });
    
        if (user) {
          // Check if the user has a valid role
          const validRoles = ['admin', 'user', 'agent'];
          if (validRoles.includes(user.role)) {
            res.send({ success: true, message: 'Login successful', user });
          } else {
            res.send({ success: false, message: 'Invalid role' });
          }
        } else {
          res.send({ success: false, message: 'Invalid phone number or pin' });
        }
      } catch (error) {
        res.status(500).send({ error: 'Failed to login' });
      }
    });
    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running!')
});

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})