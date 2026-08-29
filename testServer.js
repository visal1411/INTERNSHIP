const app = require('./src/app');
const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Server started on port ${port}`);
  
  // 1. Missing API Key
  const req1 = await fetch(`http://localhost:${port}/api/v1/iot/measurements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({"device_id":"esp32-gateway-01","cow_id":"COW-1042","breed":"Holstein","sex":"female","age_months":24,"weight_kg":350.5})
  });
  console.log('--- MISSING API KEY ---');
  console.log(JSON.stringify(await req1.json(), null, 2));
  
  // 2. Valid API Key
  const req2 = await fetch(`http://localhost:${port}/api/v1/iot/measurements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'your_iot_key' },
    body: JSON.stringify({"device_id":"esp32-gateway-01","cow_id":"COW-1042","breed":"Holstein","sex":"female","age_months":24,"weight_kg":350.5})
  });
  console.log('--- VALID API KEY ---');
  console.log(JSON.stringify(await req2.json(), null, 2));
  
  // Login Farmer A
  const req3 = await fetch(`http://localhost:${port}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({email: 'farmer1@agroscale.com', password: 'password123'})
  });
  const tokenA = (await req3.json()).token;
  
  // Login Farmer B
  const req4 = await fetch(`http://localhost:${port}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({email: 'farmer2@agroscale.com', password: 'password123'})
  });
  const tokenB = (await req4.json()).token;
  
  // Farmer B creates Cow
  await fetch(`http://localhost:${port}/api/v1/iot/measurements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'your_iot_key' },
    body: JSON.stringify({"device_id":"esp32-gateway-02","cow_id":"COW-B1","breed":"Angus","sex":"male","age_months":12,"weight_kg":250.0})
  });
  
  // Find cowId for Farmer B
  const req5 = await fetch(`http://localhost:${port}/api/v1/cows`, { headers: { 'Authorization': `Bearer ${tokenB}` }});
  const cowsB = await req5.json();
  const cowIdB = cowsB.find(c => c.cowId === "COW-B1").id;
  
  // 3. Farmer A gets Farmer B cow
  console.log('--- FARMER A GET FARMER B COW ---');
  const req6 = await fetch(`http://localhost:${port}/api/v1/cows/${cowIdB}`, { headers: { 'Authorization': `Bearer ${tokenA}` }});
  console.log(JSON.stringify(await req6.json(), null, 2));
  
  // 4. Dashboard Trends
  console.log('--- DASHBOARD TRENDS ---');
  const req7 = await fetch(`http://localhost:${port}/api/v1/dashboard/trends`, { headers: { 'Authorization': `Bearer ${tokenB}` }});
  console.log(JSON.stringify(await req7.json(), null, 2));
  
  // 5. GET Growth
  console.log('--- GET GROWTH ---');
  const req8 = await fetch(`http://localhost:${port}/api/v1/cows/${cowIdB}/growth`, { headers: { 'Authorization': `Bearer ${tokenB}` }});
  console.log(JSON.stringify(await req8.json(), null, 2));
  
  process.exit(0);
});
