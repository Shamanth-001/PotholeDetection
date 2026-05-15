const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function test() {
  const form = new FormData();
  fs.writeFileSync('test.jpg', 'fake image data');
  form.append('file', fs.createReadStream('test.jpg'));
  
  try {
    const res = await axios.post('http://localhost:8000/analyze', form, { headers: form.getHeaders() });
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
