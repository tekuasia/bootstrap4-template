import 'bootstrap'
import '../styles/index.scss'

function docReady ($) {
  $(() => {
    // document ready
    $('body').prepend('HELLO WORLD')
  })
}

docReady(jQuery)
