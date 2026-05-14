const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const sanitize = require("mongo-sanitize")
const hpp = require("hpp")
const express = require(`express`)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: 56,
})

function applySecurityMiddleware(app) {
    app.disable("x-powered-by")
    app.use(express.json({ limit: "10kb" }))
    app.use((req, res, next) => {
        if (req.body) req.body = sanitize(req.body)
        next()
    })
    app.use(hpp())
    app.use(helmet({
        xPoweredBy: false,
        contentSecurityPolicy: false,
        xDownloadOptions: false,
    }))
}

module.exports = { limiter, applySecurityMiddleware }