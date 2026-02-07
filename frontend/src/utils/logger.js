const isProduction = process.env.NODE_ENV === 'production'

const logger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args)
    }
  },
  info: (...args) => {
    if (!isProduction) {
      console.info(...args)
    }
  },
  warn: (...args) => {
    if (!isProduction) {
      console.warn(...args)
    }
  },
  error: (...args) => {
    console.error(...args)
  },
}

export default logger
