import axios from "axios";

async function check() {
  console.log("Attempting to connect to http://127.0.0.1:8000/ ...");
  try {
    const res = await axios.get("http://127.0.0.1:8000/", { timeout: 3000 });
    console.log("Success! Response data:", res.data);
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

check();
