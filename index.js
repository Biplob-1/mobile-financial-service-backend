const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

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
    const transactionsCollection = client.db("mfs").collection("transactions")

    // users insert api
    app.post('/insertUser', async (req, res) => {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        res.send(result);
    });

    // transactions insert api
    app.post('/insertTransactions', async (req, res) => {
      const transaction = req.body;
      transaction.createdAt = new Date();
      const result = await transactionsCollection.insertOne(transaction);
      res.send(result);
  });
  // all transaction get api
    app.get('/allTransaction', async (req, res) => {
      try {
        const transactionsData = await transactionsCollection.find().toArray();
        res.send(transactionsData);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch users' });
      }
    });

    // Login API
    app.post('/login', async (req, res) => {
      try {
        const { mobileNumber, pin } = req.body;
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
    
    // all users get api
    app.get('/allUsers', async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.send(users);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch users' });
      }
    });


     // Update user role and balance
    app.put('/updateUserRole/:userId', async (req, res) => {
      const userId = req.params.userId;
      const { role, balance } = req.body;

      try {
        const user = await userCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Update user role
        await userCollection.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { role: role } }
        );

        // Update balance if balanceIncrement is provided and role is 'user' or 'agent'
        if (balance && (role === 'user' || role === 'agent')) {
          await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $inc: { balance: balance } }
          );
        }

        // Fetch updated user
        const updatedUser = await userCollection.findOne({ _id: new ObjectId(userId) });

        res.json({ message: 'User role and balance updated successfully', user: updatedUser });
      } catch (error) {
        console.error('Error updating user role and balance:', error);
        res.status(500).json({ error: 'Failed to update user role and balance' });
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