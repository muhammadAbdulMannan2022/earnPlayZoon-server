const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;
// routes
app.get("/", (req, res) => {
  res.send(`this is root server`);
});

// db
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cazjtjr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // make collections
    const gallaryCollection = client.db("toysHunter").collection("gallary");
    const toysCollection = client.db("toysHunter").collection("toys");
    // sat route
    app.get("/gallary", async (req, res) => {
      const cursor = gallaryCollection.find();
      const resault = await cursor.toArray();
      res.send(resault);
    });
    app.get("/toys/:category", async (req, res) => {
      const category = req.params.category.split("_").join(" ");
      let query = {
        sub_category: category,
      };
      const cursor = toysCollection.find(query);
      const resault = await cursor.toArray();
      res.send(resault);
    });
    app.get("/alltoys", async (req, res) => {
      // .limit(20) for add a limitation
      const cursor = toysCollection.find().limit(20);
      const resault = await cursor.toArray();
      res.send(resault);
    });
    app.get("/toys/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const resault = await toysCollection.findOne(query);
      res.send(resault);
    });
    app.get("/mytoys", async (req, res) => {
      const email = req.query.email;
      let sort;
      if (req.query.sort === "ascending") {
        sort = 1;
      } else {
        sort = -1;
      }
      const query = { seller_email: email };
      const resault = await toysCollection
        .find(query)
        .sort({ price: sort })
        .toArray();
      res.send(resault);
    });
    app.get("/search/:name", async (req, res) => {
      // console.log(req.params);
      const name = req.params.name;
      // pass the regex for search to match similar all items
      const pattern = new RegExp(`(${name})`);
      // Option to skip unnecessary data
      const options = {
        projection: { _id: 1, toy_imageUrl: 1, toyname: 1, price: 1 },
      };
      const query = { toyname: { $regex: pattern, $options: "i" } };
      const resault = await toysCollection.find(query, options).toArray();
      // console.log(resault.length);
      if (resault.length == 0) {
        const errorData = [{ data: "Not Found" }];
        res.send(JSON.stringify(errorData));
      } else {
        res.send(resault);
      }
    });
    app.post("/addtoy", async (req, res) => {
      const data = req.body;
      const resault = await toysCollection.insertOne(data);

      res.send(resault);
    });
    app.patch("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const update = {
        $set: data,
      };
      const query = { _id: new ObjectId(id) };
      const resault = await toysCollection.updateOne(query, update);
      res.send(data);
    });
    app.delete("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const resault = await toysCollection.deleteOne(query);
      res.send(resault);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// end of db
// listen
app.listen(port, () => {
  console.log(`the server is running on port : ${port}`);
  console.log(`http://localhost:${port}/`);
});
