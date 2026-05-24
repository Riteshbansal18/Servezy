const express = require("express");
const { freelancerDashboard } = require("../controllers/DashboardController");
const {
  findUserServices,
  findServiceById,
  createService,
  deleteService,
  updateService,
} = require("../controllers/ServicesController");
const { findFreelancerOrders } = require("../controllers/OrdersController");
const { getFreelancerPublicProfile } = require("../controllers/UserController");
const VerifyToken = require("../middleware/Auth");
const { createServiceUpload } = require("../middleware/uploadImage");
const route = express.Router();

route.get("/dashboard", VerifyToken, async (req, res) => {
  try {
    const dashboard = await freelancerDashboard(req.userId);
    if (dashboard == "User doesn't exist") {
      return res.json({ status: 404, msg: dashboard });
    } else if (dashboard == "You Don't Have Permission") {
      return res.json({ status: 403, msg: dashboard });
    } else {
      return res.json({ status: 200, dashboard });
    }
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.get("/myServices", VerifyToken, async (req, res) => {
  try {
    const allServices = await findUserServices(req.userId);
    if (allServices) {
      return res.json({ allServices, status: 200 });
    }
    return res.json({ msg: "User Doesn't Exists", status: 404 });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.get("/service/:idService", VerifyToken, async (req, res) => {
  try {
    const selectedService = await findServiceById(req.params.idService);
    if (selectedService) {
      return res.json({ selectedService, status: 200 });
    }
    return res.json({ msg: "Service Not Found", status: 404 });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.post("/service", VerifyToken, createServiceUpload, async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.json({ msg: "You should select at least 2 images", status: 400 });
    }
    const images = req.files.map((image) => image.filename);
    const { title, description, price, category, deliveryTime } = req.body;
    const createdService = await createService(
      title, description, price, req.userId, images, category, deliveryTime
    );
    if (createdService) {
      return res.json({ msg: "Service Created Successfully", status: 200 });
    }
    return res.json({ msg: "You Already Have This Service Gig", status: 409 });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.put("/service/:idService", VerifyToken, createServiceUpload, async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.json({ msg: "You should select at least 2 images", status: 400 });
    }
    const images = req.files.map((image) => image.filename);
    const { title, description, price, category, deliveryTime } = req.body;
    const updatedService = await updateService(
      title, description, price, req.userId, images, req.params.idService, category, deliveryTime
    );
    switch (updatedService) {
      case "User Doesn't exists":
      case "Service doesn't exists":
        return res.json({ msg: updatedService, status: 404 });
      case "This service doesn't belongs to you":
        return res.json({ msg: updatedService, status: 403 });
      case "Service gig already exists":
        return res.json({ msg: updatedService, status: 409 });
      default:
        return res.json({ msg: updatedService, status: 200 });
    }
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.delete("/service/:idService", VerifyToken, async (req, res) => {
  try {
    const deletedService = await deleteService(req.userId, req.params.idService);
    if (deletedService) {
      if (deletedService == 1) {
        return res.json({ status: 404, msg: "Service doesn't exists" });
      } else if (deletedService == -1) {
        return res.json({ status: 403, msg: "This service doesn't belongs to you" });
      }
      return res.json({ status: 200, msg: "Service Deleted Successfully" });
    }
    return res.json({ status: 404, msg: "User Doesn't exists" });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

route.get("/orders", VerifyToken, async (req, res) => {
  try {
    const freelancerOrders = await findFreelancerOrders(req.userId);
    if (freelancerOrders === "You Don't Have Permission") {
      return res.json({ status: 403, msg: freelancerOrders });
    }
    if (freelancerOrders === "User Doesn't Exists") {
      return res.json({ status: 404, msg: freelancerOrders });
    }
    return res.json({ status: 200, freelancerOrders });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

// Public profile — no auth required
route.get("/public/:username", async (req, res) => {
  try {
    const profile = await getFreelancerPublicProfile(req.params.username);
    if (profile === "User Not Found") {
      return res.json({ status: 404, msg: profile });
    }
    if (profile === "Not A Freelancer") {
      return res.json({ status: 403, msg: profile });
    }
    return res.json({ status: 200, profile });
  } catch (error) {
    return res.json({ status: 505, msg: "Error Occured: " + error.message });
  }
});

module.exports = route;
