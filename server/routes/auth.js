const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const auth = require("../middlewares/auth");

const router = express.Router();


// ✅ Register
router.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // basic validations
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, passwordHash });

    // ✅ We can still return token OR not — but your flow wants login after register.
    // So we return just user/email to prefill login.
    return res.status(201).json({
      message: "Registered successfully. Please login.",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);

    // in case unique index triggers error
    if (err.code === 11000) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Current user (Protected)
router.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
