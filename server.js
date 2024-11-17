const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3004; // Set your desired port
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// 1inch API endpoint to get portfolio details based on address
app.get("/api/portfolio", async (req, res) => {
  const address = req.query.address; // Expecting 'address' as a query parameter

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    // Make the request to the 1inch API
    const response = await axios.get(
      `https://api.1inch.dev/portfolio/portfolio/v4/overview/erc20/details?addresses=${address}`,
      {
        headers: {
          Authorization: "Bearer budlbXCMPebX7rJWElK4CFUqRgkqp06i", // Replace with your actual API key
        },
      }
    );
    // Return the data from the 1inch API to the frontend
    return res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from 1inch API:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch data from 1inch API" });
  }
});

app.get("/api/value_chart", async (req, res) => {
  const { address, chainId } = req.query;

  // Validate the required query parameters
  if (!address || !chainId) {
    return res.status(400).json({ error: "Address and chainId are required" });
  }

  try {
    // Make the request to the 1inch API
    const response = await axios.get(
      `https://api.1inch.dev/portfolio/portfolio/v4/general/value_chart?addresses=${address}&chain_id=${chainId}&timerange=1year`,
      {
        headers: {
          Authorization: "Bearer budlbXCMPebX7rJWElK4CFUqRgkqp06i", // Replace with your actual API key
        },
      }
    );
    // Return the data from the 1inch API to the frontend
    return res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching data from 1inch API:",
      error.response.data,
      chainId
    );
    return res
      .status(500)
      .json({ error: "Failed to fetch data from 1inch API" });
  }
});

app.get("/api/profit_loss", async (req, res) => {
  const { address, chainId } = req.query;

  // Validate the required query parameters
  if (!address || !chainId) {
    return res.status(400).json({ error: "Address and chainId are required" });
  }

  try {
    // Make the request to the 1inch API
    const response = await axios.get(
      `https://api.1inch.dev/portfolio/portfolio/v4/overview/erc20/profit_and_loss?addresses=${address}&chain_id=${chainId}&timerange=1day`,
      {
        headers: {
          Authorization: "Bearer budlbXCMPebX7rJWElK4CFUqRgkqp06i", // Replace with your actual API key
        },
      }
    );
    // Return the data from the 1inch API to the frontend
    return res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching data from 1inch API: profi",
      error.response.data,
      chainId
    );
    return res
      .status(500)
      .json({ error: "Failed to fetch data from 1inch API" });
  }
});

app.get("/api/eth/transactions", async (req, res) => {
  const address = req.query.address; // Expecting 'address' as a query parameter

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    // Make the request to the 1inch API
    const response = await axios.get(
      `https://blockscout.com/eth/mainnet/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`
    );
    // Return the data from the 1inch API to the frontend
    return res.json(response.data);
  } catch (error) {
    console.error("Error fetching data from 1inch API:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch data from 1inch API" });
  }
});

app.get("/api/current_value", async (req, res) => {
  const { address, chainId } = req.query;

  // Validate the required query parameters
  if (!address || !chainId) {
    return res.status(400).json({ error: "Address and chainId are required" });
  }

  try {
    // Make the request to the 1inch API
    const response = await axios.get(
      `https://api.1inch.dev/portfolio/portfolio/v4/overview/erc20/current_value?addresses=${address}&chain_id=${chainId}`,
      {
        headers: {
          Authorization: "Bearer budlbXCMPebX7rJWElK4CFUqRgkqp06i", // Replace with your actual API key
        },
      }
    );
    // Return the data from the 1inch API to the frontend
    return res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching data from 1inch API:",
      error.response.data,
      chainId
    );
    return res
      .status(500)
      .json({ error: "Failed to fetch data from 1inch API" });
  }
});

// Start the backend server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
