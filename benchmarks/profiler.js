const util = require('util')

function formatTime (time, precision) {
  // If we're dealing with ms, round up to seconds when time is at least 1 second
  if (time > 1000 && precision === 'ms') {
    return (Math.floor(time / 100) / 10) + ' s'
  } else {
    return time.toFixed(3) + ' ' + precision
  }
}

// get time in ns
function getTime () {
  const t = process.hrtime()
  return (t[0] * 1e9 + t[1])
}

/**
 * Create a profiler with name testName to monitor the execution time of a route
 * The profiler has two arguments: a step msg and an optional reset for the internal timer
 * It will display the execution time per step and total from latest rest
 *
 * Optional logToConsole flag, which defaults to true, causes steps to be printed to console.
 * otherwise, they can be accessed from Profiler.steps array.
 */
function Profiler (name, logToConsole, precision) {
  this.name = name
  this.steps = []
  this.sinceBeginning = null
  this.lastStep = null
  this.logToConsole = typeof (logToConsole) === 'undefined' ? true : logToConsole
  this.precision = typeof (precision) === 'undefined' ? 'ms' : precision
  this.divisor = 1

  if (this.precision === 'ms') this.divisor = 1e6
}

Profiler.prototype.beginProfiling = function () {
  if (this.logToConsole) { console.log(this.name + ' - Begin profiling') }
  this.resetTimers()
}

Profiler.prototype.resetTimers = function () {
  this.sinceBeginning = getTime()
  this.lastStep = getTime()
  this.steps.push(['BEGIN_TIMER', this.lastStep])
}

Profiler.prototype.elapsedSinceBeginning = function () {
  return (getTime() - this.sinceBeginning) / this.divisor
}

Profiler.prototype.elapsedSinceLastStep = function () {
  return (getTime() - this.lastStep) / this.divisor
}

// Return the deltas between steps, in nanoseconds

Profiler.prototype.getSteps = function () {
  const divisor = this.divisor

  return this.steps.map(function (curr, index, arr) {
    if (index === 0) return undefined
    const delta = (curr[1] - arr[index - 1][1])
    return [curr[0], (delta / divisor)]
  }).slice(1)
}

Profiler.prototype.step = function (msg) {
  if (!this.sinceBeginning || !this.lastStep) {
    console.log(util.format(
      '%s - %s - You must call beginProfiling before registering steps',
      this.name,
      msg
    ))
    return
  }

  if (this.logToConsole) {
    console.log(util.format('%s - %s - %s (total: %s)',
      this.name,
      msg,
      formatTime(this.elapsedSinceLastStep(), this.precision),
      formatTime(this.elapsedSinceBeginning(), this.precision)
    ))
  }

  this.lastStep = getTime()
  this.steps.push([msg, this.lastStep])
}

module.exports = Profiler
