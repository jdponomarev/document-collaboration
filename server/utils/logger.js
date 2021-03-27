const winston = require("winston");
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL,
	format: winston.format.json(),
	transports: [
        new winston.transports.Console({
            level: 'error',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
	],
});
module.exports = logger;