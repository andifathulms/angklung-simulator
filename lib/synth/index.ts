/**
 * The synthesis core. Pure: no Web Audio, no DOM, no React, no clock, no
 * module-level mutable state. It runs in Node, which is what makes the instrument
 * testable rather than judged by ear.
 */
export * from './types'
export * from './prng'
export * from './excitation'
export * from './resonator'
export * from './angklung'
export * from './render'
