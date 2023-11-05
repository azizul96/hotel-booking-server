require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

// middleware
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.13lfhki.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();


    const roomsCollection = client.db("hotelBookingDB").collection("rooms");
    const bookingsCollection = client.db("hotelBookingDB").collection("bookings");

    app.get('/rooms', async(req, res)=>{
      const result = await roomsCollection.find().toArray()
      res.send(result)
    })

    // bookings
    app.post('/bookings', async(req, res)=>{
      const booking = req.body
      const result = await bookingsCollection.insertOne(booking)
      res.send(result)
  
    })

    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hotel Booking app is running !')
  })
  
app.listen(port, () => {
    console.log(`Hotel Booking app running on port ${port}`)
  })