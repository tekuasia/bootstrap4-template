import 'bootstrap'
import '../styles/index.scss'
import test from './test'

function docReady ($) {
  $(() => {
    // document ready
    test()
  })
}

docReady(jQuery)
