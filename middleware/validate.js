const joi = require("joi")

const registerSchema = joi.object({
    userName: joi.string().alphanum().min(3).max(30).required(),
    password: joi.string().alphanum().min(8).max(20).required()
})

const loginSchema = joi.object({
    userName: joi.string().required(),
    password: joi.string().required()
})
const productScema = joi.object({
    name: joi.string().min(2).max(100).required(),
    price: joi.number().positive().required(),
    stock: joi.number().integer().min(0).default(0)
});
function validate(schema) {
    return (req, res, next) => {
        if (!req.body) return res.status(400).json({ message: "Request body is missing" })
        const { error } = schema.validate(req.body)
        if (error) return res.status(400).json({ message: error.details[0].message })
        next()
    }
}

module.exports = { validate, registerSchema, loginSchema , productScema}