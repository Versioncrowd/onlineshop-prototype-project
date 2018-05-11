const express = require('express');
const fs = require('fs');
const path = require('path');
const Router = express.Router;
const app = express();
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const mailnotifier = require('./mailnotifier');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const randomstring = require('randomstring');

const signature = 'mysignature';
const frontendDirectoryPath = path.resolve(__dirname, './../static');

console.log('static resource at: ' + frontendDirectoryPath);

let shopConfigPath = './.online_shop.json';
/* let shopConfigPath = process.env.HOME + '/.online_shop.json'; */
let shopConfig = null;

if (!fs.existsSync(shopConfigPath)) {
  console.log('Online Shop config file was not found. Server stops.');
  process.exit();
} else {
  shopConfig = require(shopConfigPath);
}

console.info('MYSQL: user "%s", db "%s", pass length %s', shopConfig.mysql_usr, shopConfig.mysql_db, shopConfig.mysql_pwd.length);
var con = mysql.createConnection({
  host: 'localhost',
  user: shopConfig.mysql_usr,
  password: shopConfig.mysql_pwd,
  database: shopConfig.mysql_db
});

app.use(express.static(frontendDirectoryPath));
app.use(cors());
app.use(bodyParser());

// always want to have /api in the beginning
const apiRouter = new Router();
app.use('/api', apiRouter);

apiRouter.get('/', (req, res) => {
  res.send({ 'shop-api': '1.0' });
});

apiRouter.get('/products', (req, res, next) => {
  con.query('select * from products', function(err, rows) {
    if (err) return next(err);

    // console.log(rows);
    res.json(rows);
  });
});

apiRouter.get('/products', (req, res, next) => {
  con.query('select * from products', function(err, rows) {
    if (err) return next(err);

    // console.log(rows);
    res.json(rows);
  });
});

apiRouter.get('/categories', (req, res, next) => {
  con.query('select * from product_categories', function(err, rows) {
    if (err) return next(err);

    // console.log(rows);
    res.json(rows);
  });
});

apiRouter.get('/customers', function(req, res, next) {
  con.query('select * from customers where active = 1', function(err, rows) {
    if (err) return next(err);

    // console.log(rows);
    res.json(rows);
  });
});

apiRouter.get('/payment_methods', function(req, res, next) {
  con.query('select * from payment_methods', function(err, rows) {
    if (err) return next(err);

    // console.log(rows);
    res.json(rows);
  });
});

apiRouter.put('/activate/:activationcode', function(req, res, next) {
  con.query('update customers set active = 1 where activationcode = ?', [req.params.activationcode],
    function(err, rows) {
      if (err) return next(err);
      else {
        con.query(`select * from customers where activationcode = ?`, [req.params.activationcode], function(err, rows) {

          if(rows.length > 0) {
            const user = rows[0];
            const token = jwt.sign({ user: user.email, pwd: user.pwd }, signature)
            user.token = token;
            delete user.pwd;
            return res.json(user);
          }

          else {
            return console.log(error);
          }
        })
      }
    });
});

apiRouter.post('/login', function(req, res, next) {
  if (!req.body.email)
    return res.json({ err: 'username required' })

  if (!req.body.pwd)
    return res.json({ err: 'password required' })

  con.query('select * from customers where email = ?', [req.body.email], function(err, rows) {
    if (err) {
      return res.json({ err: 'Internal error happened' });
    }

    // check if answer from DB and if the password from DB matches the hash
    if (rows.length > 0) {
      bcrypt.compare(req.body.pwd, rows[0].pwd, function(err, hashRes) {
        if (hashRes) {
          const token = jwt.sign({email: rows[0].email, pwd: rows[0].pwd}, signature);
          const user = rows[0];
          user.token = token;
          delete user.pwd;
          return res.json(user);
        }
      })
    } else {
      return res.json({ err: 'Username/ Password-Combination does not exist.' });
    }
  });
});
// 

apiRouter.post('/register', function(req, res, next) {
  console.log(req.body);
  if (!req.body.email)
    return res.json({ err: 'username required' })
  if (!req.body.pwd)
    return res.json({ err: 'password required' })
  con.query('select * from customers where email = ?', [req.body.email], function(err, rows) {
    if (err) {
      return res.json({ err: 'Internal error happened' });
    }
    if (rows.length > 0) {
      return res.json({ err: 'This Email is already in use!' });
    } else { // insert retrieved values into DB
      const activationcode = randomstring.generate(20);
      bcrypt.hash(req.body.pwd, 0, function(err, pwdHash) {
              console.log(req.body.pwd);
              con.query(`insert into customers (firstname, lastname, street, postal, city, phone, email, pwd, activationcode) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [req.body.firstname, req.body.lastname, req.body.street, req.body.postal, req.body.city, req.body.phone, req.body.email, pwdHash, activationcode],
        function(err, rows) {
          if (err) {
            return res.json({ err: 'Error creating user' + err });
          } else {
            // send a Message to the User with an Activation Link
            let text = `
            Dear ${req.body.firstname} ${req.body.lastname},
            Thank you for registration with Devugees-Shop. Please click the Link to activate your account.
            <a href="http://localhost:5000/activate=${activationcode}">
            http://localhost:5000/activate=${activationcode}</a>`;

            if (shopConfig.mailnotifications === '1') {
              console.log('sending mail to ' + req.body.email);
              mailnotifier(req.body.email, 'Your Registration at Devugees-Shop', text);
              if (err) { console.log(err) }
            };
            return res.json({ success: rows });
          }
        })
      })
    }
  });
});


apiRouter.post('/update', function(req, res, next) {
  console.log(req.body);
  res.json({ err: 'BALVLA.' });

  
});

// Middleware Function that ensures that the user ordering has a webtoken
function ensureToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  console.log(req.headers);
  if(typeof bearerHeader != "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    console.log(bearer);
    next();
  } else {
    return res.sendStatus(403);
  }
}

function isAuthorized(req, res, next) {
  jwt.verify(req.token, signature, function(err, data) {
    console.log('Arrive at middleware ensure token is authorization')
    if (err)
      return res.send(403)
    else
      console.log('decrypted token: ' + JSON.stringify(data));
      next();
  });
}


apiRouter.post('/order', ensureToken, isAuthorized, function(req, res, next) {
  console.log('RECEIVING: ' + JSON.stringify(req.body));

  con.query('insert into orders (customer_id, payment_id, created, paid) values (?, ?, now(), NULL)', [req.body.user.id, req.body.payment_method], function(err, rows) {
    if (err) {
      return res.json({ err: err });
    }

    const newOrderId = rows.insertId;
    let sql = "insert into order_details (order_id, product_id, price) values ";

    let ordervalue = 0;
    for (let i = 0; i < req.body.products.length; i++) {
      const p = req.body.products[i];
      let values = "(" + newOrderId + ", " + p.id + ", " + p.price + ")";
      sql += values;
      if (i < req.body.products.length - 1) {
        sql += ','
      }

      ordervalue += parseInt(p.price) * parseInt(p.quantity);
    }

    con.query(sql, function(err, rows) {
      if (err) {
        return res.json({ err: err });
      }

      let text = `
            Dear ${req.body.user.name},
              Thank you for your order.
              We wish you a nice day.
              Your Devugees-Shop Team.
          `;

      console.log('mn: ' + shopConfig.mailnotifications);
      if (shopConfig.mailnotifications == 1) {
        mailnotifier(req.body.user.email, 'Your Order at Devugees-Shop', text);
      };
      return res.json({ success: rows });
    });
  });
});

apiRouter.put('/user/:userid', function(req, res, next) {
  console.log('userid: ' + req.params.userid);
  var sql = 'update customers set ';
  var i = 1;
  var bodyLength = Object.keys(req.body).length;
  var values = [];
  for (var field in req.body) {
    sql += field + ' = ?';
    if (i < bodyLength)
      sql += ',';
    i++;
    values.push(req.body[field]);
  }

  sql += ' where id = ?';
  values.push(req.params.userid);
  con.query(sql,
    values,
    function(err, rows) {
      if (err) return next(err);

      console.log(rows);
      res.json(rows);
    });
});

apiRouter.delete('/user/:userid', function(req, res, next) {
  con.query('update customers set deleted = now() where id = ?', [req.params.userid],
    function(err, rows) {
      if (err) return next(err);

      console.log(rows);
      res.json(rows);
    });
});

apiRouter.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.code = 404;
  next(err);
});

apiRouter.use(function(err, req, res, next) {
  console.warn('Error occured for "%s":\n%s', req.url, err.stack);
  res.json(err);
});

// avoid starting server if the connection to the DB cannot be established
con.connect(function(err) {
  if (err) throw err;

  app.listen(9090, (err) => {
    if (err) throw err;
    console.log('Server started on port 9090');
  });
});