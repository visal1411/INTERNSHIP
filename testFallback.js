const app = require('./src/app');
const prisma = require('./src/lib/prisma');

const server = app.listen(0, async () => {
  const port = server.address().port;
  
  await prisma.weightStandard.deleteMany({
    where: { breed: 'Angus', sex: 'male' }
  });
  
  await prisma.weightStandard.create({
    data: {
      breed: 'Angus',
      sex: 'male',
      ageMinMonths: 20,
      ageMaxMonths: 30,
      minHealthyWeight: 500.0,
      maxHealthyWeight: 700.0
    }
  });

  const req1 = await fetch(`http://localhost:${port}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({email: 'farmer2@agroscale.com', password: 'password123'})
  });
  const tokenB = (await req1.json()).token;

  const iotRes = await fetch(`http://localhost:${port}/api/v1/iot/measurements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'your_iot_key' },
    body: JSON.stringify({
      device_id: "esp32-gateway-02",
      cow_id: "COW-B3",
      breed: "Angus",
      sex: "male",
      age_months: 24,
      weight_kg: 400.0
    })
  });
  
  console.log('--- IOT INGEST RAW RESPONSES ---');
  console.log(JSON.stringify(await iotRes.json(), null, 2));

  const cowsB = await (await fetch(`http://localhost:${port}/api/v1/cows`, { headers: { 'Authorization': `Bearer ${tokenB}` }})).json();
  const cowIdB = cowsB.find(c => c.cowId === "COW-B3").id;

  console.log('--- DASHBOARD TRENDS ---');
  console.log(JSON.stringify(await (await fetch(`http://localhost:${port}/api/v1/dashboard/trends`, { headers: { 'Authorization': `Bearer ${tokenB}` }})).json(), null, 2));

  console.log('--- GET GROWTH ---');
  console.log(JSON.stringify(await (await fetch(`http://localhost:${port}/api/v1/cows/${cowIdB}/growth`, { headers: { 'Authorization': `Bearer ${tokenB}` }})).json(), null, 2));

  process.exit(0);
});
