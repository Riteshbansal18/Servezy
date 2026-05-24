const Order = require("../models/orderModel");
const { getServiceRating } = require("./TestimonialsController");
const { findServiceById } = require("./ServicesController");
const { findUserById } = require("./UserController");
const { sendMessage } = require("./ChatController");
const { sendOrderNotificationEmail, sendOrderCompletedEmail, sendOrderCancelledEmail } = require("../config/mailer");

const findOrder = async (orderId) => {
  const selectedOrder = await Order.findById(orderId);
  return selectedOrder;
};

const findClientOrders = async (clientId) => {
  const selectedClient = await findUserById(clientId);
  if (selectedClient) {
    if (selectedClient.role != "client") {
      return "You Don't Have Permission";
    }
    const clientOrders = await Order.find({ clientId }).sort({ updatedAt: -1 });
    if (clientOrders.length != 0) {
      let allOrdersInfo = [];
      for (let i of clientOrders) {
        const serviceInfo = await findServiceById(i.serviceId.toString());
        const serviceRating = await getServiceRating(i.serviceId.toString());
        const serviceUserInfo = await findUserById(serviceInfo.userId);
        const ordersInfo = {
          serviceInfo,
          serviceRating,
          serviceUserInfo,
          status: i.status,
          _id: i._id,
        };
        allOrdersInfo.push(ordersInfo);
      }
      return allOrdersInfo;
    }
    return [];
  }
  return "User Doesn't Exists";
};

const findClientOrder = async (clientId, orderId) => {
  const selectedClient = await findUserById(clientId);
  if (selectedClient) {
    if (selectedClient.role != "client") {
      return "You Don't Have Permission";
    }
    const clientOrder = await findOrder(orderId);
    if (clientOrder) {
      const serviceInfo = await findServiceById(
        clientOrder.serviceId.toString()
      );
      const serviceRating = await getServiceRating(
        clientOrder.serviceId.toString()
      );
      const serviceUserInfo = await findUserById(serviceInfo.userId);
      const orderInfo = {
        serviceInfo,
        serviceRating,
        serviceUserInfo,
        status: clientOrder.status,
        _id: clientOrder._id,
      };
      return orderInfo;
    }
    return "Order Doesn't Exists";
  }
  return "User Doesn't Exists";
};

const makeOrder = async (clientId, serviceId) => {
  const selectedClient = await findUserById(clientId);
  if (selectedClient) {
    if (selectedClient.role != "client") {
      return "You Don't Have Permission";
    }
    const selectedService = await findServiceById(serviceId);
    if (selectedService) {
      const orderExists = await Order.find({
        clientId: selectedClient._id,
        serviceId: selectedService._id,
        status: "OnGoing",
      });
      if (orderExists.length != 0) {
        return "You Already Have A Uncompleted Order For This Service";
      }
      const text = `Hello,I would like to order ${selectedService.title} service`;
      await sendMessage(clientId, selectedService.userId, text);
      const createdOrder = await Order.create({
        clientId: selectedClient._id,
        serviceId: selectedService._id,
      });
      // Send email notification to freelancer
      try {
        const freelancer = await findUserById(selectedService.userId);
        if (freelancer && freelancer.email) {
          await sendOrderNotificationEmail(
            freelancer.email,
            freelancer.fullName || freelancer.username,
            selectedClient.fullName || selectedClient.username,
            selectedService.title
          );
        }
      } catch (emailErr) {
        console.log("Order email notification failed:", emailErr.message);
      }
      return "Order Made Successfully";
    }
    return "Service Doesn't Exists";
  }
  return "User Doesn't Exists";
};

const updateOrder = async (clientId, orderId, orderState) => {
  const selectedClient = await findUserById(clientId);
  if (selectedClient) {
    if (selectedClient.role != "client") {
      return "You Don't Have Permission";
    }
    const selectedOrder = await findOrder(orderId);
    if (selectedOrder) {
      if (selectedOrder.clientId.toString() != clientId) {
        return "You Don't Have Permission";
      }
      if (orderState != "Completed" && orderState != "Cancelled") {
        return "Order Status Unrecognized";
      }
      const updatedOrder = await Order.updateOne(
        { clientId, _id: orderId, status: "OnGoing" },
        { status: orderState }
      );

      // Send email notifications after successful update
      if (updatedOrder.modifiedCount === 1) {
        try {
          const serviceInfo = await findServiceById(selectedOrder.serviceId.toString());
          const freelancer = await findUserById(serviceInfo.userId);

          if (orderState === "Completed") {
            // Notify client that order is completed
            if (selectedClient.email) {
              await sendOrderCompletedEmail(
                selectedClient.email,
                selectedClient.fullName || selectedClient.username,
                freelancer.fullName || freelancer.username,
                serviceInfo.title
              );
            }
          } else if (orderState === "Cancelled") {
            // Notify freelancer that order was cancelled
            if (freelancer && freelancer.email) {
              await sendOrderCancelledEmail(
                freelancer.email,
                freelancer.fullName || freelancer.username,
                selectedClient.fullName || selectedClient.username,
                serviceInfo.title
              );
            }
          }
        } catch (emailErr) {
          console.log("Order status email notification failed:", emailErr.message);
        }
      }

      return updatedOrder;
    }
    return "Order doesn't exists";
  }
  return "User doesn't exists";
};

const findFreelancerOrders = async (freelancerId) => {
  const selectedFreelancer = await findUserById(freelancerId);
  if (!selectedFreelancer) return "User Doesn't Exists";
  if (selectedFreelancer.role !== "freelancer") return "You Don't Have Permission";

  const serviceModel = require("../models/serviceModel");
  const freelancerServices = await serviceModel.find({ userId: freelancerId });
  const serviceIds = freelancerServices.map(s => s._id);

  const orders = await Order.find({ serviceId: { $in: serviceIds } }).sort({ updatedAt: -1 });
  let allOrdersInfo = [];
  for (let order of orders) {
    const serviceInfo = await findServiceById(order.serviceId.toString());
    const clientInfo = await findUserById(order.clientId.toString());
    const serviceRating = await getServiceRating(order.serviceId.toString());
    const { password, otp, otpExpiry, ...safeClient } = clientInfo.toObject();
    allOrdersInfo.push({
      serviceInfo,
      serviceRating,
      clientInfo: safeClient,
      status: order.status,
      _id: order._id,
      createdAt: order.createdAt,
    });
  }
  return allOrdersInfo;
};

module.exports = {
  findClientOrder,
  findClientOrders,
  makeOrder,
  updateOrder,
  findOrder,
  findFreelancerOrders,
};
