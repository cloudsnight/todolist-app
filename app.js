//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connect process.env.PORT
const port = process.env.PORT || 3000;

// mongoose connect
const uri = "mongodb+srv://admin-muchsin:stealth@cluster0.2va5q3b.mongodb.net/todolistDB";

// mongoose create schema
const itemsSchema = new mongoose.Schema({
  name: String,
});
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

// mongoose create model named Item
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// mongoose create Item document
const item1 = new Item({
  name: "Welcome to your to do List",
});
const item2 = new Item({
  name: "Hit the + button to add new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item",
});

// create an array default items
const defaultItems = [item1, item2, item3];

// app get
app.get('/favicon.ico', (req, res) => res.status(204));

app.get("/", function (req, res) {
  Item.find({}).then(
    (foundItems) => {
      // do testing if there is any length on foundItems
      if (foundItems.length === 0) {
        // Doing insert many
        Item.insertMany(defaultItems).then(() => {
          console.log("Added documents.");
        });
        res.redirect("/");
      } else {
        //if there is a length
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    },
    (err) => console.log(err)
  );
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  console.log(customListName);
  List.findOne({name: customListName}).then(function(foundList){
    // if("undefined"){
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    // }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

// app post
app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  // adding new body list from submit button to get the value
  const listName = req.body.list;

  const addNew = new Item({
    name: itemName,
  });

  // Make an if statement acording condition from customListName params
  if(listName === "Today"){
    addNew.save().then(() => {
      console.log("saved new item !");
    });
    res.redirect("/"); 
  } else {
    // Search one name from db lists collections
    List.findOne({name: listName}).then((dbList)=>{
      // push some addNew item to db lists collection on items column or items object array
      dbList.items.push(addNew);
      dbList.save();
      // redirect back into customListName params
      res.redirect("/" +listName);
    }, (err)=> {console.log(err)});
  }
});

app.post("/delete", function (req, res) {
  const checkbox = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndDelete(checkbox).then(() => {
      console.log("Delete success that found by id !");
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkbox }}}).then(()=>{
      console.log("delete success by pull from items array that checked by id");
      res.redirect("/" + listName);
    });
  }
});

app.listen(port, function () {
  console.log("Server started on port 3000");
  mongoose.connect(uri);
});
