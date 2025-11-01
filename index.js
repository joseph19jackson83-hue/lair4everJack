require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // servir index.html, css, js depuis public/

const MONCASH_API = process.env.MONCASH_API || 'https://sandbox.moncashbutton.digicelgroup.com/Api';
const MONCASH_GATEWAY = process.env.MONCASH_GATEWAY || 'https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware';
const CLIENT_ID = process.env.MONCASH_CLIENT_ID;
const CLIENT_SECRET = process.env.MONCASH_CLIENT_SECRET;

// helper: get access token (basic client_id:secret -> base64)
async function getAccessToken(){
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${MONCASH_API}/oauth/token`, {
    method:'POST',
    headers:{ 'Authorization': `Basic ${creds}`, 'Content-Type':'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const json = await res.json();
  return json.access_token;
}

// create order endpoint - called by frontend
app.post('/api/create-order', async (req,res)=>{
  try{
    const { items, total } = req.body;
    const orderId = uuidv4();
    // create MonCash payment (example simplified)
    const token = await getAccessToken();

    const payload = {
      amount: total, // number
      orderId: orderId,
      // callback url MonCash will call when done (must be public/HTTPS)
      returnUrl: `${process.env.SERVER_URL || 'https://yourdomain.com'}/api/moncash/return`,
      cancelUrl: `${process.env.SERVER_URL || 'https://yourdomain.com'}/api/moncash/cancel`,
      description: `Commande ${orderId}`
    };

    const mcRes = await fetch(`${MONCASH_GATEWAY}/business/v1/payment`, {
      method:'POST',
      headers:{ 'Authorization': `Bearer ${token}`, 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const mcJson = await mcRes.json();
    // mcJson should contain paymentUrl or transactionId depending on API
    // Save order to your DB with mcJson.transactionId etc (omitted)
    return res.json({ ok:true, paymentUrl: mcJson.paymentUrl || mcJson.redirectUrl || mcJson.checkoutUrl, raw: mcJson });
  }catch(err){
    console.error(err);
    res.status(500).json({ ok:false, error:err.message });
  }
});

// moncash callback (server-to-server)
app.post('/api/moncash/notify', async (req,res)=>{
  // MonCash will POST transaction details here. Validate signature & token
  console.log('MonCash notify', req.body);
  // update DB order status accordingly
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log('Server started',PORT));