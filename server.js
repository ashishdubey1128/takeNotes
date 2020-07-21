var express = require("express");

var app = express();

var bodyParser = require("body-parser");

var request = require("request");

var bcrypt = require('bcrypt');

var CryptoJS = require('crypto-js');

//===========================
//DATABASE
//===========================
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "takeNotes"
});

//==============
//connect to DB
//==============
con.connect(function(err) {
		  if (err) console.log(err)
		  });


//===========
//Date
//===========


var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!

var yyyy = today.getFullYear();
if (dd < 10) {
  dd = '0' + dd;
} 
if (mm < 10) {
  mm = '0' + mm;
} 
var today = dd + '/' + mm + '/' + yyyy;
var dt = today.toString();


//=====================
//CREATE TABLE
//=====================

// con.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");
   var sql = "CREATE TABLE users (id int(11) AUTO_INCREMENT  PRIMARY KEY, username VARCHAR(255) UNIQUE, password VARCHAR(255) NOT NULL)";
   con.query(sql, function (err, result) {
     if (err) throw err;
     console.log("Table created");
   });
   var sql2 = "CREATE TABLE notes (id int(11) NOT NULL AUTO_INCREMENT,username VARCHAR(255) NOT NULL,title VARCHAR(20) NOT NULL, text VARCHAR(500) NOT NULL, date VARCHAR(50) NOT NULL)";
   con.query(sql2, function (err, result) {
     if (err) throw err;
    console.log("Table created");
 });
//});


app.use(bodyParser.urlencoded({extended:true}));


var uid = "";



app.get("/", function(req,res)
{
	res.render("landing.ejs");
});

//===================
//signup Route
//===================

app.post("/register",function(req,res)
{
	var pass = req.body.password+req.body.username;

	//====================
	//Password Encryption
	//====================

	bcrypt.hash(pass, 10, function(err, hash) {
		  console.log("Connected!");
		  var sql = "INSERT INTO users (username, password) VALUES (?,?)";
		  let todo = [req.body.username, hash];
		  con.query(sql,todo, function (err, result, fields) {
		    if (err)
		    {
		    	console.log(err);
		    	res.redirect("/");
		    }
		    uid = req.body.username;
		    console.log("Account Created");
		    res.redirect("/notes/"+uid);
		  });
	});
});


//=====================
//LOGIN ROUTE
//=====================

app.post("/login",function(req,res)
{
	var pass = req.body.password+req.body.username;

		  console.log("Connected!");
		  var sql = "SELECT * FROM users WHERE username = ?";
		  var email = [req.body.username];
		  con.query(sql,email, function (err, result, fields) {
		    if (err) throw err;
		    if(result.length >0){
            bcrypt.compare(pass, result[0].password, function(errr, rese) { 
  				if(rese) {
  					console.log(result[0]);
  					uid = result[0].username;
  					console.log("logged in  : "+uid);
                res.redirect("/notes/"+uid);
  				} else {
  					console.log("error");
   					res.redirect("/");
  			} 
		});
                
            }
		  });
});



app.get("/notes/:id",isLoggedIn,function(req,res)
{
	
		  console.log("Connected!");
		  var sql = "SELECT * FROM notes WHERE username = ?";
		  con.query(sql,[req.params.id], function (err, result, fields) {
		    if (err) throw err;
		    var ans =[];
		    result.forEach(function(result)
		    {
		    	var crypt = result.text;
  						const passphrase = '12345678';
  						const bytes = CryptoJS.AES.decrypt(crypt, passphrase);
 						const originalText = bytes.toString(CryptoJS.enc.Utf8);
 						ans.push({"title":result.title,"text":originalText,"date":result.date,"id":result.id});
		    });
		    res.render("notes.ejs",{ans:ans,result:result});
		  });	
});


app.post("/notes",function(req,res)
{

	//=========================
	//NOTES ENCRYPTION
	//=========================


	var hash = ""; 
	var txt = req.body.notes;
  	const passphrase = '12345678';
  	hash = CryptoJS.AES.encrypt(txt, passphrase).toString();
	console.log(hash);

	var sql = "INSERT INTO notes (username,title,text,date) values (?,?,?,?)";
	var val = [uid,req.body.title,hash,dt];
	con.query(sql,val,function(err,res,fi)
	{
		if(err) console.log(err);
		console.log(res[0]);
		
	});
	res.redirect("/notes/"+uid);
});


//======================
//Delete NOTES
//======================

app.get("/delnotes/:id",function(req,res)
{
	var sql = "DELETE FROM notes WHERE id = ?";
  	con.query(sql,[req.params.id],function (err, result) {
    if (err) throw err;
    	console.log("Number of records deleted: " + result.affectedRows);
  });
  	res.redirect("/notes/"+uid);
});


//====================
//LOGOUT ROUTE
//====================

app.get("/logout",function(req,res)
{
	uid="";
	res.redirect("/");
})



//============
//isloggedin
//============

function isLoggedIn(req,res,next) {
	if(uid!="")
	{
		//console.log(uid);
		return next();
	}
	res.redirect("/");
}

//===========
//PORT
//===========

var port = 3000||process.env.PORT;
app.listen(port,function(){
	console.log("Listening at 3000");
});
