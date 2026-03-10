const Joi = require('joi');

const schemas = {
    // Auth
    register: Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('customer', 'store_owner', 'admin').required(),
        mobileNumber: Joi.string().allow('', null)
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    // Stores
    registerStore: Joi.object({
        storeName: Joi.string().min(2).max(100).required(),
        ownerId: Joi.string().length(24).hex().required(), 
        location: Joi.string().required(),
        category: Joi.string().required(),
        hasDeliveryPartner: Joi.boolean().default(false)
    }),

    // Offers
    addOffer: Joi.object({
        title: Joi.string().min(3).max(100).required(),
        description: Joi.string().max(500).allow(''),
        discount: Joi.number().min(0).max(100).required(),
        originalPrice: Joi.number().min(0).required(),
        storeId: Joi.string().length(24).hex().required(),
        expiryDate: Joi.date().greater('now').required(),
        category: Joi.string().required(),
        isOnline: Joi.boolean().default(false),
        image: Joi.string().allow(null, '')
    }),
    updateOffer: Joi.object({
        title: Joi.string().min(3).max(100),
        description: Joi.string().max(500).allow(''),
        discount: Joi.number().min(0).max(100),
        originalPrice: Joi.number().min(0),
        storeId: Joi.string().length(24).hex(),
        expiryDate: Joi.date(),
        category: Joi.string(),
        isOnline: Joi.boolean(),
        image: Joi.string().allow(null, '')
    }).min(1) // At least one field must be present for update
};

module.exports = schemas;
