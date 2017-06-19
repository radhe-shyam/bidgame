var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'bidgame'
});

connection.connect();

function generateToken(){
  var token = '';
  for(var i=0;i<4;i++)
    token += Math.floor((Math.random() * 10000) * 0x10000).toString(36);
  return token;
};
function authenticate(req,res,next){
  var token = req.headers.token,
      user = req.headers.user;
  connection.query("select 1 from users where name='" + user+"' and token='"+token+"'", function(err, rows, fields) {
    if (err) {
      console.log(err);
      res.send({status:401,msg:'Sql Error.'});
    } else {
      if(rows.length){
        next();
      }else{
        res.send({status:401,msg:'User not authorised.'});
      }
    }
  });
};
router.get('/', function(req, res, next) {
  res.render('index');
});
router.post('/api/login',function(req,res){
  var uname = req.body.name;
  if(!uname){
    res.send({status:0,msg:'Name is not available.'});
  }
  var token = generateToken();
  connection.query("select * from users where name='" + uname+"'", function(err, rows, fields) {
    if (err) {
      console.log(err);
      res.send({status:0,msg:'Sql Error.'});
    } else {
      if (rows.length) {
        var rec = rows[0];
        connection.query("update users set token='"+token+"' where name='"+uname+"'", function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.send({status:0,msg:'Sql Error.'});
          } else {
            connection.query("select * from auctions where starting_time+90000 > "+new Date().valueOf(), function(err, rows, fields) {
              if (err) {
                console.log(err);
                res.send({status:0,msg:'Sql Error.'});
              } else {
                res.send({status:1,data:{name:uname,coins:rec.coins,token:token,Bread:rec.Bread,Carrot:rec.Carrot,Diamond:rec.Diamond,auction:rows[0]}});
              }
            });
          }
        });
      } else {
        connection.query("insert into users values('"+uname+"',1000,'"+token+"',30,18,1)", function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.send({status:0,msg:'Sql Error.'});
          } else {
            connection.query("select * from auctions where starting_time+90000 > "+new Date().valueOf(), function(err, rows, fields) {
              if (err) {
                console.log(err);
                res.send({status:0,msg:'Sql Error.'});
              } else {
                res.send({status:1,data:{name:uname,coins:1000,token:token,Bread:30,Carrot:18,Diamond:1,auction:rows[0]}});
              }
            });
          }
        });
      }
    }
  });
});

router.post('/api/startAuction',authenticate,function(req,res){
  var name = req.body.name,
      qty = req.body.qty,
      bid = req.body.bid,
      user = req.headers.user,
      time = new Date().valueOf();
  connection.query("select 1 from auctions where starting_time+90000 > "+time, function(err, rows, fields) {
    if (err) {
      console.log(err);
      res.send({status:0,msg:'Sql Error.'});
    } else {
      if(rows.length){
          res.send({status:0,msg:'Auction already running.'});
      }else{
        connection.query("insert into auctions(seller,item_name,qty,min_bid,starting_time,bid_winner) values('"+user+"','"+name+"',"+qty+","+bid+","+time+",'-')", function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.send({status:0,msg:'Sql Error.'});
          } else {
            res.send({status:1,msg:'Auction started.'});
          }
        });

      }
    }
  });
});

router.post('/api/bid',authenticate,function(req,res){
  var id = req.body.id,
      price = req.body.price,
      user = req.headers.user,
      time = new Date().valueOf();
  connection.query("insert into bids values("+id+",'"+user+"',"+price+")", function(err, rows, fields) {
    if (err) {
      console.log(err);
      res.send({status:0,msg:'Sql Error.'});
    } else {
      res.send({status:1,msg:'Successful'});
    }
  });
});

module.exports = router;
