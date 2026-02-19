const Contact = require("../models/Contact");


const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        message: "Please provide name, email, subject and message" 
      });
    }

    // Save to database
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
      status: "unread"
    });

    res.status(201).json({
      message: "Message sent successfully! We'll get back to you soon.",
      contactId: contact._id
    });

  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
};

const getContactSubmissions = async (req, res) => {
  try {
    const contacts = await Contact.find().sort("-createdAt");
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    contact.status = status || contact.status;
    await contact.save();

    res.json({ message: "Contact status updated", contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitContact,
  getContactSubmissions,
  updateContactStatus
};